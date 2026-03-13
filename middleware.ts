import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    if (isLoggedIn && pathname === "/login") {
      const role = req.auth?.user?.role || "mahasiswa";
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
    }
    return NextResponse.next();
  }

  // API routes need auth
  if (pathname.startsWith("/api")) {
    if (!isLoggedIn) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Dashboard routes need auth
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based route protection
  const role = req.auth?.user?.role;
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
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
