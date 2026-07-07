import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";
const LOCALES = ["es", "ca", "eu", "gl", "en"];

function localizedUrls(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${APP_URL}/${locale}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // Raíz y landing principal
    { url: APP_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...localizedUrls("", 1, "weekly"),

    // Registro y login
    ...localizedUrls("/registro", 0.9, "monthly"),
    ...localizedUrls("/login", 0.5, "yearly"),

    // Landing pages SEO
    { url: `${APP_URL}/erp-autonomos-espana`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${APP_URL}/software-facturacion-pymes`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${APP_URL}/verifactu-software-certificado`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${APP_URL}/alternativa-holded`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${APP_URL}/alternativa-sage-autonomos`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${APP_URL}/modelo-130-online`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${APP_URL}/software-recursos-humanos-pymes`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${APP_URL}/software-control-horario`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${APP_URL}/software-almacen-inventario`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },

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
