import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

// Satellite SEO landing pages — public marketing pages, must never require auth
const SATELLITE_PATHS = [
  "/erp-autonomos-espana", "/software-facturacion-pymes", "/verifactu-software-certificado",
  "/alternativa-holded", "/alternativa-sage-autonomos", "/modelo-130-online",
  "/software-recursos-humanos-pymes", "/software-control-horario", "/software-almacen-inventario",
  "/software-crm-pymes", "/software-contabilidad-pymes", "/software-nominas-pymes",
];

// Paths that don't require authentication (without locale prefix)
const PUBLIC_PATHS = [
  "/", "/login", "/registro", "/recuperar-password", "/auth/callback",
  "/privacidad", "/aviso-legal", "/terminos", "/cookies", "/ayuda",
  "/sobre-nosotros", "/contacto",
  ...SATELLITE_PATHS,
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

  // Redirect unsupported locale prefixes (e.g. /it/contacto → /contacto)
  // Prevents Google from being redirected to /es/login (which is Disallow in robots.txt)
  const unsupportedLocaleMatch = pathname.match(/^\/([a-z]{2})(\/.*)?$/i);
  const unsupportedSegment = unsupportedLocaleMatch?.[1];
  if (unsupportedSegment) {
    const segment = unsupportedSegment.toLowerCase();
    if (!(routing.locales as readonly string[]).includes(segment)) {
      const rest = unsupportedLocaleMatch?.[2] ?? "/";
      return NextResponse.redirect(new URL(rest, request.url), 301);
    }
  }

  // Strip locale prefix to get the actual path
  const localePattern = new RegExp(`^/(${routing.locales.join("|")})(/.*)?\$`);
  const localeMatch = pathname.match(localePattern);
  const pathWithoutLocale = localeMatch ? localeMatch[2] || "/" : pathname;
  const currentLocale = localeMatch
    ? localeMatch[1]
    : routing.defaultLocale;

  const isPublicPath = PUBLIC_PATHS.includes(pathWithoutLocale) || pathWithoutLocale.startsWith("/fichar");
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

  // These pages live at root with NO locale prefix in the URL — bypass intl middleware.
  // Important: only bypass when the request truly has no /es, /ca, /eu, /gl, /en prefix.
  // A locale-prefixed home route (e.g. /en, /ca) must still go through intlMiddleware —
  // otherwise next-intl can't resolve the request locale for server-side translations
  // (getMessages/useTranslations), even though the URL segment is correct.
  const NO_LOCALE_PATHS = ["/", "/auth/callback", "/privacidad", "/aviso-legal", "/terminos", "/cookies", "/ayuda", "/sobre-nosotros", "/contacto", ...SATELLITE_PATHS];
  if (!localeMatch && (NO_LOCALE_PATHS.includes(pathname) || pathname.startsWith("/fichar"))) {
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
