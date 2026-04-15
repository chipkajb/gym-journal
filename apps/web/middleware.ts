import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/library",
  "/workouts",
  "/history",
  "/training",
  "/tools",
  "/timer",
  "/wod",
  "/analytics",
];
const authPaths = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const path = req.nextUrl.pathname;
  const isProtected = protectedPaths.some((p) => path.startsWith(p));
  const isAuthPage = authPaths.includes(path);

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/library/:path*",
    "/workouts/:path*",
    "/history/:path*",
    "/training",
    "/training/:path*",
    "/tools",
    "/tools/:path*",
    "/timer",
    "/timer/:path*",
    "/wod",
    "/wod/:path*",
    "/analytics",
    "/analytics/:path*",
    "/login",
    "/register",
  ],
};
