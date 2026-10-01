import type { Metadata } from "next";
import { ContabilidadContent } from "@/components/marketing/pages/contabilidad-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";
const SLUG = "software-contabilidad-pymes";

export const metadata: Metadata = {
  title: "Software de Contabilidad para Pymes España — YouWhole",
  description:
    "Contabilidad automática según el PGC español. Asientos automáticos, balance y pérdidas y ganancias integrados con facturación. Sin conocimientos contables.",
  keywords: [
    "software contabilidad pymes España",
    "contabilidad automática PGC",
    "programa contabilidad autónomos",
    "asientos contables automáticos",
    "balance sheet pymes",
    "libro IVA online",
    "contabilidad integrada facturación",
  ],
  alternates: {
    canonical: `${APP_URL}/${SLUG}`,
    languages: {
      es: `${APP_URL}/${SLUG}`,
      ca: `${APP_URL}/ca/${SLUG}`,
      eu: `${APP_URL}/eu/${SLUG}`,
      gl: `${APP_URL}/gl/${SLUG}`,
      en: `${APP_URL}/en/${SLUG}`,
      "x-default": `${APP_URL}/${SLUG}`,
    },
  },
  openGraph: {
    title: "Software Contabilidad Pymes — YouWhole",
    description: "Asientos automáticos según el PGC español. Integrado con facturación VeriFactu. Sin conocimientos contables.",
    url: `${APP_URL}/${SLUG}`,
  },
};

export default function SoftwareContabilidadPage() {
  return <ContabilidadContent />;
}
