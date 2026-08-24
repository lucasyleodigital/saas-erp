import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MarketingHomeContent } from "@/components/marketing/marketing-home";
import { routing } from "@/i18n/routing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

const OG_LOCALE: Record<string, string> = {
  es: "es_ES",
  ca: "ca_ES",
  eu: "eu_ES",
  gl: "gl_ES",
  en: "en_US",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // "/es" is a duplicate of the canonical "/" — no metadata needed, it redirects.
  if (locale === "es") return {};

  const t = await getTranslations({ locale, namespace: "marketing.seo" });
  const title = t("title");
  const description = t("description");
  const url = `${APP_URL}/${locale}`;

  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: url,
      languages: {
        es: APP_URL,
        ca: `${APP_URL}/ca`,
        eu: `${APP_URL}/eu`,
        gl: `${APP_URL}/gl`,
        en: `${APP_URL}/en`,
        "x-default": APP_URL,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: OG_LOCALE[locale] ?? "es_ES",
    },
  };
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Spanish content already lives at the canonical root "/" — redirect to
  // avoid serving the exact same page at two URLs (duplicate content).
  if (locale === "es") {
    redirect("/");
  }

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    redirect("/");
  }

  return <MarketingHomeContent />;
}
