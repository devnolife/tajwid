# syntax=docker/dockerfile:1.6

# ---------- Base ----------
FROM node:24-alpine AS base
WORKDIR /app

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Builder ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Variabel dummy hanya agar build (drizzle config + auth init) tidak error.
# Nilai sebenarnya disuntikkan saat runtime via docker-compose / env.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV AUTH_SECRET="build-time-placeholder-not-used-at-runtime"
ENV NEXTAUTH_SECRET="build-time-placeholder-not-used-at-runtime"
RUN npm run build

# ---------- Runner (production) ----------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3015
ENV HOSTNAME=0.0.0.0
ENV PAYMENT_PROOF_DIR=/app/data/payment-proofs

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs \
 && mkdir -p /app/data/payment-proofs \
 && chown -R nextjs:nodejs /app/data

# Standalone output dari Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# File yang dibutuhkan untuk db:push & db:seed dari container
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER nextjs
EXPOSE 3015
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -qO- http://127.0.0.1:3015/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
