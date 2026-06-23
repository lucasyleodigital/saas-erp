import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${APP_URL}`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/es`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/sobre-nosotros`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${APP_URL}/contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${APP_URL}/ayuda`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/es/registro`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${APP_URL}/es/login`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${APP_URL}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${APP_URL}/aviso-legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${APP_URL}/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${APP_URL}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
