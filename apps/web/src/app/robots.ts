import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tusaas.es";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/registro"],
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
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
