import { NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";

const ADMIN_PREFIX = "/admin";
const PUBLIC_PATHS = new Set(["/login"]);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth?.user;
  const isAdmin = req.auth?.user?.role === "ADMIN";
  const pathname = nextUrl.pathname;

  const isPublicPath = PUBLIC_PATHS.has(pathname);
  const isAdminPath = pathname.startsWith(ADMIN_PREFIX);

  if (isPublicPath) {
    if (isAuthenticated) {
      const destination = isAdmin ? "/admin" : "/";
      return NextResponse.redirect(new URL(destination, nextUrl));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && !isAdmin) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
