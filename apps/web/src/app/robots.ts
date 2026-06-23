import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/es/",
          "/sobre-nosotros",
          "/contacto",
          "/ayuda",
          "/es/registro",
          "/es/login",
          "/privacidad",
          "/aviso-legal",
          "/terminos",
          "/cookies",
        ],
        disallow: [
          "/dashboard/",
          "/facturas/",
          "/clientes/",
          "/presupuestos/",
          "/productos/",
          "/inventario/",
          "/pedidos/",
          "/compras/",
          "/proveedores/",
          "/leads/",
          "/pipeline/",
          "/automatizaciones/",
          "/contabilidad/",
          "/empleados/",
          "/nominas/",
          "/albaranes/",
          "/configuracion/",
          "/empresa/",
          "/billing/",
          "/notificaciones/",
          "/verifactu/",
          "/importacion/",
          "/invite/",
          "/portal/",
          "/api/",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/sobre-nosotros", "/contacto", "/ayuda"],
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/sobre-nosotros", "/contacto", "/ayuda"],
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/sobre-nosotros", "/contacto", "/ayuda"],
        disallow: ["/dashboard/", "/api/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
