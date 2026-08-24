import type { Metadata } from "next";
import { HoldedContent } from "@/components/marketing/pages/holded-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Alternativa a Holded para Autónomos y Pymes — YouWhole",
  description:
    "¿Buscas una alternativa a Holded más completa y asequible? YouWhole incluye VeriFactu certificado, IRPF automático, Modelo 130/303 y soporte en español. Desde 29 EUR/mes.",
  keywords: [
    "alternativa holded",
    "alternativa holded autónomos",
    "mejor que holded",
    "holded vs youwhole",
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
    title: "Alternativa a Holded — YouWhole",
    description: "Más completo que Holded para el mercado español. VeriFactu, IRPF, Modelo 130/303 y soporte nativo en español.",
    url: `${APP_URL}/alternativa-holded`,
  },
};

export default function AlternativaHoldedPage() {
  return <HoldedContent />;
}
