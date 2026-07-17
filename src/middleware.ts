import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/verify",
  "/api/certificates/verify",
  "/api/certificates/by-nim",
  "/api/certificates/check",
  "/api/health",
  "/_next",
  "/favicon.ico",
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    // Auth.js v5 default cookie names; salt = cookie name
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
    salt:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });
  const isLoggedIn = !!token;
  const role = (token?.role as string | undefined) ?? undefined;

  // Login page: redirect ke dashboard kalau sudah login
  if (pathname === "/login") {
    if (isLoggedIn) {
      const r = role || "mahasiswa";
      return NextResponse.redirect(new URL(`/${r}/dashboard`, req.url));
    }
    return NextResponse.next();
  }

  // Public routes
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // API routes (selain /api/auth) butuh auth
  if (pathname.startsWith("/api")) {
    if (!isLoggedIn) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Dashboard / halaman lain butuh auth
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based protection
  if (pathname.startsWith("/mahasiswa") && role !== "mahasiswa") {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }
  if (pathname.startsWith("/instruktur") && role !== "instruktur") {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match semua kecuali:
    // - _next/static, _next/image, favicon.ico
    // - asset publik: /logo, /uploads
    // - file dengan ekstensi gambar/font/svg/ico/css/js/map yang umum di /public
    "/((?!_next/static|_next/image|favicon.ico|logo/|uploads/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|bmp|avif|woff|woff2|ttf|otf|css|js|map)$).*)",
  ],
};
