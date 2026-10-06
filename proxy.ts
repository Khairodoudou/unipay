import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "uni_pay_session";

// Routes protégées nécessitant une session active
const PROTECTED_PREFIXES = [
  "/admin",
  "/agent",
  "/chef",
  "/directeur",
  "/comptable",
  "/controle-financier",
  "/employe",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  // Vérifier si la route actuelle fait partie des espaces protégés
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedRoute && !sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/agent/:path*",
    "/chef/:path*",
    "/directeur/:path*",
    "/comptable/:path*",
    "/controle-financier/:path*",
    "/employe/:path*",
  ],
};
