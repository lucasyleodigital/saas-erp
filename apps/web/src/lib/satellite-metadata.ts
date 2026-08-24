import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

const OG_LOCALE: Record<string, string> = {
  es: "es_ES",
  ca: "ca_ES",
  eu: "eu_ES",
  gl: "gl_ES",
  en: "en_US",
};

/**
 * Builds generateMetadata for a satellite landing page's [locale] variant.
 * "es" returns empty metadata since that locale redirects to the canonical
 * unprefixed route instead of rendering its own page (avoids duplicate content).
 */
export function createSatelliteMetadata(slug: string, namespace: string) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    if (locale === "es") return {};

    const t = await getTranslations({ locale, namespace: `satellite.${namespace}.seo` });
    const title = t("title");
    const description = t("description");
    const url = `${APP_URL}/${locale}/${slug}`;

    return {
      title: { absolute: title },
      description,
      robots: { index: true, follow: true },
      alternates: {
        canonical: url,
        languages: {
          es: `${APP_URL}/${slug}`,
          ca: `${APP_URL}/ca/${slug}`,
          eu: `${APP_URL}/eu/${slug}`,
          gl: `${APP_URL}/gl/${slug}`,
          en: `${APP_URL}/en/${slug}`,
          "x-default": `${APP_URL}/${slug}`,
        },
      },
      openGraph: {
        title: t("ogTitle"),
        description: t("ogDescription"),
        url,
        type: "website",
        locale: OG_LOCALE[locale] ?? "es_ES",
      },
    };
  };
}
