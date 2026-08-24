import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";
const LOCALES = ["es", "ca", "eu", "gl", "en"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Locale variants of the home page — "es" is intentionally excluded:
  // it redirects to the canonical root APP_URL to avoid duplicate content.
  const TRANSLATED_LOCALES = LOCALES.filter((l) => l !== "es");

  // Satellite SEO landing pages — each has a Spanish canonical (bare path)
  // plus translated /ca, /eu, /gl, /en variants.
  const SATELLITE_PAGES: { slug: string; priority: number }[] = [
    { slug: "erp-autonomos-espana", priority: 0.95 },
    { slug: "software-facturacion-pymes", priority: 0.95 },
    { slug: "verifactu-software-certificado", priority: 0.9 },
    { slug: "alternativa-holded", priority: 0.9 },
    { slug: "alternativa-sage-autonomos", priority: 0.9 },
    { slug: "modelo-130-online", priority: 0.85 },
    { slug: "software-recursos-humanos-pymes", priority: 0.9 },
    { slug: "software-control-horario", priority: 0.9 },
    { slug: "software-almacen-inventario", priority: 0.9 },
    { slug: "software-crm-pymes", priority: 0.9 },
    { slug: "software-contabilidad-pymes", priority: 0.9 },
    { slug: "software-nominas-pymes", priority: 0.9 },
  ];

  const satelliteUrls: MetadataRoute.Sitemap = SATELLITE_PAGES.flatMap(({ slug, priority }) => [
    { url: `${APP_URL}/${slug}`, lastModified: now, changeFrequency: "monthly" as const, priority },
    ...TRANSLATED_LOCALES.map((locale) => ({
      url: `${APP_URL}/${locale}/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority,
    })),
  ]);

  return [
    // Raíz y landing principal
    { url: APP_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...TRANSLATED_LOCALES.map((locale) => ({
      url: `${APP_URL}/${locale}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
    })),

    // Landing pages SEO (+ variantes de idioma)
    ...satelliteUrls,

    // Páginas de marketing
    { url: `${APP_URL}/sobre-nosotros`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${APP_URL}/contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${APP_URL}/ayuda`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },

    // Legales
    { url: `${APP_URL}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${APP_URL}/aviso-legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${APP_URL}/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${APP_URL}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
