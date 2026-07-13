export interface SecurityHeader {
  key: string;
  value: string;
}

const BASE_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://simak.unismuh.ac.id https://images.unsplash.com",
  "connect-src 'self'",
  "worker-src 'self' blob:",
];

export function getSecurityHeaders(
  environment: Record<string, string | undefined> = process.env,
): SecurityHeader[] {
  const production = environment.NODE_ENV === "production";
  const contentSecurityPolicy = [
    ...BASE_CONTENT_SECURITY_POLICY,
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
  ];
  if (production) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }
  return headers;
}
