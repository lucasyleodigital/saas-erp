import type { Metadata } from "next";
import { HoldedContent } from "@/components/marketing/pages/holded-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: { absolute: "Alternativa a Holded con plan gratuito y nóminas incluidas — YouWhole" },
  description:
    "Compara YouWhole y Holded: plan gratuito para siempre, facturas ilimitadas desde 29 € con IVA, VeriFactu y nóminas incluidas. Datos de noviembre de 2026.",
  keywords: [
    "alternativa holded",
    "alternativa holded autónomos",
    "holded vs youwhole",
    "holded precios",
    "holded verifactu",
    "alternativa holded gratis",
    "ERP autónomos España alternativa",
    "software facturación alternativa holded",
  ],
  alternates: {
    canonical: `${APP_URL}/alternativa-holded`,
    languages: {
      es: `${APP_URL}/alternativa-holded`,
      ca: `${APP_URL}/ca/alternativa-holded`,
      eu: `${APP_URL}/eu/alternativa-holded`,
      gl: `${APP_URL}/gl/alternativa-holded`,
      en: `${APP_URL}/en/alternativa-holded`,
      "x-default": `${APP_URL}/alternativa-holded`,
    },
  },
  openGraph: {
    title: "YouWhole vs Holded: comparativa con datos actualizados",
    description: "Plan gratuito, precios con IVA incluido y nóminas sin módulos aparte. Compara con datos de noviembre de 2026.",
    url: `${APP_URL}/alternativa-holded`,
  },
};

export default function AlternativaHoldedPage() {
  return <HoldedContent />;
}
