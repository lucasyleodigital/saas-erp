import type { Metadata } from "next";
import { ErpAutonomosContent } from "@/components/marketing/pages/erp-autonomos-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "ERP para Autónomos en España — YouWhole",
  description:
    "El ERP diseñado por autónomos para autónomos. Facturación con VeriFactu, IRPF automático, Modelo 130/303, contabilidad PGC y CRM. Sin permanencia. Desde 29 EUR/mes.",
  keywords: [
    "ERP autónomos España",
    "software gestión autónomos",
    "facturación autónomos España",
    "IRPF autónomos online",
    "Modelo 130 autónomos",
    "programa facturación autónomos",
    "ERP freelance España",
  ],
  alternates: {
    canonical: `${APP_URL}/erp-autonomos-espana`,
    languages: {
      es: `${APP_URL}/erp-autonomos-espana`,
      ca: `${APP_URL}/ca/erp-autonomos-espana`,
      eu: `${APP_URL}/eu/erp-autonomos-espana`,
      gl: `${APP_URL}/gl/erp-autonomos-espana`,
      en: `${APP_URL}/en/erp-autonomos-espana`,
      "x-default": `${APP_URL}/erp-autonomos-espana`,
    },
  },
  openGraph: {
    title: "ERP para Autónomos en España — YouWhole",
    description: "Diseñado por autónomos para autónomos. VeriFactu, IRPF, Modelo 130/303 y CRM en una sola plataforma.",
    url: `${APP_URL}/erp-autonomos-espana`,
  },
};

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "YouWhole — ERP para Autónomos",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${APP_URL}/erp-autonomos-espana`,
  description: "ERP todo en uno diseñado específicamente para autónomos españoles: facturación VeriFactu, IRPF automático, Modelo 130/303, contabilidad y CRM.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "Plan gratuito disponible" },
  availableInCountry: "ES",
  inLanguage: "es-ES",
};

export default function ErpAutonomosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
      <ErpAutonomosContent />
    </>
  );
}
