import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

// App routes that require authentication — no SEO value, waste crawl budget
const APP_ROUTES = [
  "/dashboard",
  "/facturas",
  "/clientes",
  "/presupuestos",
  "/pedidos",
  "/albaranes",
  "/inventario",
  "/configuracion",
  "/empresa",
  "/contabilidad",
  "/fiscal",
  "/banco",
  "/compras",
  "/proveedores",
  "/productos",
  "/empleados",
  "/nominas",
  "/control-horario",
  "/calendario",
  "/pipeline",
  "/leads",
  "/proyectos",
  "/importacion",
  "/auditoria",
  "/backup",
  "/notificaciones",
  "/automatizaciones",
  "/webhooks",
  "/campos-personalizados",
  "/billing",
  "/verifactu",
  "/contratos",
  "/flota",
  "/gastos",
  "/api/",
  "/portal/",
  "/fichar/",
  "/invite/",
  "/auth/",
  "/admin",
];

// Generate locale-prefixed variants for each app route
const LOCALES = ["es", "ca", "eu", "gl", "en"];
const localeAppRoutes = APP_ROUTES.flatMap((route) =>
  LOCALES.map((locale) => `/${locale}${route}`),
);

// Disallow matches by prefix: "/verifactu" would also block the landing
// "/verifactu-software-certificado". Routes without a trailing slash are
// limited to the exact path ("$") and its subpaths ("/").
const toRules = (route: string) =>
  route.endsWith("/") ? [route] : [`${route}$`, `${route}/`];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...APP_ROUTES, ...localeAppRoutes].flatMap(toRules),
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
