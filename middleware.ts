// import { withAuth } from "next-auth/middleware";
// import { NextResponse } from "next/server";

// export default withAuth(
//   function middleware(req) {
//     // Extract the token we mapped in NextAuth
//     const token = req.nextauth.token;
//     const path = req.nextUrl.pathname;

//     // 1. Route the Product Owner
//     if (token?.role === "product_owner" && path === "/") {
//       return NextResponse.redirect(new URL("/po-dashboard", req.url));
//     }

//     // 2. Route the Admin (for Module 4)
//     if (token?.role === "admin" && path === "/") {
//       return NextResponse.redirect(new URL("/admin-dashboard", req.url));
//     }

//     // 3. Prevent non-POs from accessing the PO Dashboard
//     if (path.startsWith("/po-dashboard") && token?.role !== "product_owner") {
//       return NextResponse.redirect(new URL("/", req.url));
//     }

//     // 4. Prevent non-Admins from accessing the Admin Dashboard
//     if (path.startsWith("/admin-dashboard") && token?.role !== "admin") {
//       return NextResponse.redirect(new URL("/", req.url));
//     }
//   },
//   {
//     callbacks: {
//       // Require the user to have a token to access protected routes
//       authorized: ({ token }) => !!token,
//     },
//   }
// );

// // Define which routes this middleware should protect and watch
// export const config = {
//   matcher: ["/", "/po-dashboard", "/admin-dashboard"],
// };

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // If logged in and visiting root, redirect based on role
  if (pathname === "/") {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (token.role === "product_owner") return NextResponse.redirect(new URL("/po-dashboard", req.url));
    if (token.role === "admin") return NextResponse.redirect(new URL("/admin-dashboard", req.url));
    if (token.role === "user") return NextResponse.redirect(new URL("/user/dashboard", req.url));
  }

  // Protect dashboards — redirect to login if not authenticated
  if (pathname.startsWith("/po-dashboard") && token?.role !== "product_owner") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/admin-dashboard") && token?.role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/user-dashboard") && token?.role !== "user") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/po-dashboard/:path*", "/admin-dashboard/:path*", "/user-dashboard/:path*"],
};