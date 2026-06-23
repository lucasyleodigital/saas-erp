import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

// Paths that don't require authentication (without locale prefix)
const PUBLIC_PATHS = [
  "/", "/login", "/registro", "/recuperar-password", "/auth/callback",
  "/privacidad", "/aviso-legal", "/terminos", "/cookies", "/ayuda",
  "/sobre-nosotros", "/contacto",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next.js internals, API routes, and SEO files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.json" ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2|xml|json|txt)$/)
  ) {
    return NextResponse.next();
  }

  // Strip locale prefix to get the actual path
  const localePattern = new RegExp(`^/(${routing.locales.join("|")})(/.*)?\$`);
  const localeMatch = pathname.match(localePattern);
  const pathWithoutLocale = localeMatch ? localeMatch[2] || "/" : pathname;
  const currentLocale = localeMatch
    ? localeMatch[1]
    : routing.defaultLocale;

  const isPublicPath = PUBLIC_PATHS.includes(pathWithoutLocale);
  const isAuthPath =
    pathWithoutLocale === "/login" || pathWithoutLocale === "/registro";

  const session = request.cookies.get("auth_session")?.value;

  // Authenticated user trying to access login/register → go to dashboard
  if (session && isAuthPath) {
    return NextResponse.redirect(
      new URL(`/${currentLocale}/dashboard`, request.url)
    );
  }

  // Unauthenticated user trying to access protected route → go to login
  if (!session && !isPublicPath) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // These pages live at root (no locale prefix) — bypass intl middleware
  const NO_LOCALE_PATHS = ["/", "/auth/callback", "/privacidad", "/aviso-legal", "/terminos", "/cookies", "/ayuda", "/sobre-nosotros", "/contacto"];
  if (NO_LOCALE_PATHS.includes(pathWithoutLocale) || NO_LOCALE_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Let next-intl handle locale routing and detection
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
