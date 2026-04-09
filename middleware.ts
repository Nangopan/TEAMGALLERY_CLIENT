import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  console.log("🔍 Middleware triggered:", { pathname, hasToken: !!token, role: token?.role });

  // If logged in and visiting root, redirect based on role
  if (pathname === "/") {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (token.role === "product_owner") return NextResponse.redirect(new URL("/po/dashboard", req.url));
    if (token.role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (token.role === "user") return NextResponse.redirect(new URL("/user/dashboard", req.url));
  }

  // Protect all /po/* paths
  if (pathname.startsWith("/po/")) {
    if (!token || token.role !== "product_owner") {
      console.log("🚫 Blocking /po/ access - redirecting to login");
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Protect all /admin/* paths
  if (pathname.startsWith("/admin/")) {
    if (!token || token.role !== "admin") {
      console.log("🚫 Blocking /admin/ access - redirecting to login");
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Protect all /user/* paths
  if (pathname.startsWith("/user/")) {
    if (!token || token.role !== "user") {
      console.log("🚫 Blocking /user/ access - redirecting to login");
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/po/:path*", "/admin/:path*", "/user/:path*"],
};