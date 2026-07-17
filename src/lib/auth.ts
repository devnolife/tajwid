import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@shared/schema";
import { storage } from "@/lib/db/storage";
import { fetchMahasiswaByNim } from "@/lib/graphql-campus";
import {
  hashPassword,
  verifyAndUpgradePassword,
  verifyPassword,
} from "@/lib/security/password";
import { FixedWindowRateLimiter } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";

const loginRateLimiter = new FixedWindowRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1_000,
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;
        const forwardedFor = request.headers.get("x-forwarded-for")
          ?.split(",")[0]
          ?.trim();
        const clientAddress = forwardedFor || request.headers.get("x-real-ip") || "unknown";
        const rateLimitKey = `${clientAddress}:${username.toLowerCase()}`;
        const rateLimit = loginRateLimiter.consume(rateLimitKey);
        if (!rateLimit.allowed) {
          logger.warn("auth.login.rate_limited", {
            username,
            clientAddress,
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          });
          return null;
        }
        const completeLogin = <T extends { role: string }>(user: T): T => {
          loginRateLimiter.reset(rateLimitKey);
          logger.info("auth.login.succeeded", {
            username,
            clientAddress,
            role: user.role,
          });
          return user;
        };

        // Auto-detect: jika username berupa angka → mahasiswa (NIM)
        const isMahasiswa = /^\d+$/.test(username);

        if (isMahasiswa) {
          const nim = username;

          // Cek di database lokal dulu (skip jika DB tidak tersedia)
          try {
            const user = await storage.getUserByNim(nim);
            if (user) {
              if (user.role !== "mahasiswa") {
                return null;
              }
              const valid = await verifyAndUpgradePassword(
                password,
                user.password,
                user.role,
                (encodedPassword) => storage.updateUser(user.id, { password: encodedPassword }),
              );
              if (!valid) {
                return null;
              }

              // Sinkronkan nama dari GraphQL kampus agar selalu up-to-date
              try {
                const mahasiswa = await fetchMahasiswaByNim(nim);
                if (mahasiswa && mahasiswa.nama && mahasiswa.nama !== user.name) {
                  await storage.updateUser(user.id, {
                    name: mahasiswa.nama,
                    email: mahasiswa.email || user.email,
                    phone: mahasiswa.hp || user.phone,
                    program: mahasiswa.prodi || user.program,
                  });
                  user.name = mahasiswa.nama;
                  user.email = mahasiswa.email || user.email;
                }
              } catch {
                // GraphQL tidak tersedia — gunakan data lokal
              }

              return completeLogin({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                username: user.username,
                nim: user.nim,
                faculty: user.faculty,
                program: user.program,
                phone: user.phone,
                specialization: user.specialization,
              });
            }
          } catch {
            // DB tidak tersedia — lanjut ke GraphQL
          }

          // User belum ada di lokal — query GraphQL kampus
          const mahasiswa = await fetchMahasiswaByNim(nim);

          if (mahasiswa) {
            const upstreamVerification = await verifyPassword(
              password,
              mahasiswa.passwd,
              "mahasiswa",
            );
            if (!upstreamVerification.valid) {
              return null;
            }

            // Coba simpan ke lokal, skip jika DB tidak tersedia
            let userId = nim;
            let userName = mahasiswa.nama;
            let userEmail = mahasiswa.email;
            try {
              const user = await storage.createUser({
                username: mahasiswa.nim,
                password: await hashPassword(password),
                role: "mahasiswa",
                name: mahasiswa.nama,
                nim: mahasiswa.nim,
                email: mahasiswa.email,
                phone: mahasiswa.hp,
                program: mahasiswa.prodi,
              });
              userId = user.id;
              userName = user.name;
              userEmail = user.email;
            } catch {
              // DB tidak tersedia — tetap return user dari GraphQL
            }

            return completeLogin({
              id: userId,
              name: userName,
              email: userEmail,
              role: "mahasiswa",
              username: nim,
              nim: nim,
              faculty: null,
              program: mahasiswa.prodi,
              phone: mahasiswa.hp,
              specialization: null,
            });
          }

          return null;
        }

        // Instruktur & Admin: login dari database lokal
        try {
          const user = await storage.getUserByUsername(username);

          if (!user || user.role === "mahasiswa") {
            return null;
          }
          const valid = await verifyAndUpgradePassword(
            password,
            user.password,
            user.role,
            (encodedPassword) => storage.updateUser(user.id, { password: encodedPassword }),
          );
          if (!valid) {
            return null;
          }

          return completeLogin({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            username: user.username,
            nim: user.nim,
            faculty: user.faculty,
            program: user.program,
            phone: user.phone,
            specialization: user.specialization,
          });
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.nim = (user as any).nim;
        token.faculty = (user as any).faculty;
        token.program = (user as any).program;
        token.phone = (user as any).phone;
        token.specialization = (user as any).specialization;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).username = token.username as string;
        (session.user as any).nim = token.nim as string | null;
        (session.user as any).faculty = token.faculty as string | null;
        (session.user as any).program = token.program as string | null;
        (session.user as any).phone = token.phone as string | null;
        (session.user as any).specialization = token.specialization as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET (atau NEXTAUTH_SECRET) wajib di-set di production. Lihat https://authjs.dev/reference/core/errors#missingsecret",
    );
  } else {
    console.warn(
      "[auth] AUTH_SECRET / NEXTAUTH_SECRET belum di-set. Generate dengan: npx auth secret",
    );
  }
}
