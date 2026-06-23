import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";
const LOCALES = ["es", "en", "fr", "de", "pt", "it"];
const DEFAULT_LOCALE = "es";

const pages = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/sobre-nosotros", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/contacto", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/ayuda", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/registro", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/login", changeFrequency: "yearly" as const, priority: 0.5 },
  { path: "/privacidad", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/aviso-legal", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terminos", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly" as const, priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return pages.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: `${APP_URL}/${locale}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: locale === DEFAULT_LOCALE ? page.priority : page.priority * 0.8,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${APP_URL}/${l}${page.path}`]),
        ),
      },
    })),
  );
}
