import type { Metadata } from "next";
import { SageContent } from "@/components/marketing/pages/sage-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Alternativa a Sage para Autónomos y Pymes — YouWhole",
  description:
    "¿Sage es demasiado caro o complejo para tu negocio? YouWhole es la alternativa moderna: VeriFactu certificado, IRPF automático, sin instalación y desde 29 EUR/mes.",
  keywords: [
    "alternativa sage autónomos",
    "alternativa sage pymes",
    "sage vs youwhole",
    "alternativa sage 50",
    "software facturación alternativa sage",
    "ERP barato alternativa sage",
  ],
  alternates: {
    canonical: `${APP_URL}/alternativa-sage-autonomos`,
    languages: {
      es: `${APP_URL}/alternativa-sage-autonomos`,
      ca: `${APP_URL}/ca/alternativa-sage-autonomos`,
      eu: `${APP_URL}/eu/alternativa-sage-autonomos`,
      gl: `${APP_URL}/gl/alternativa-sage-autonomos`,
      en: `${APP_URL}/en/alternativa-sage-autonomos`,
      "x-default": `${APP_URL}/alternativa-sage-autonomos`,
    },
  },
  openGraph: {
    title: "Alternativa a Sage para Autónomos — YouWhole",
    description: "Más sencillo y asequible que Sage. VeriFactu incluido, sin instalación, desde 29 EUR/mes.",
    url: `${APP_URL}/alternativa-sage-autonomos`,
  },
};

export default function AlternativaSagePage() {
  return <SageContent />;
}
