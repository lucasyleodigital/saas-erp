import type { Metadata } from "next";
import { VerifactuContent } from "@/components/marketing/pages/verifactu-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software VeriFactu Certificado AEAT — YouWhole",
  description:
    "YouWhole es un software de facturación certificado VeriFactu por la Agencia Tributaria. Cumple con la obligación legal desde el primer día. Incluido en todos los planes, incluso el gratuito.",
  keywords: [
    "software VeriFactu certificado",
    "VeriFactu AEAT",
    "software facturación VeriFactu",
    "programa VeriFactu autónomos",
    "VeriFactu pymes España",
    "facturación electrónica VeriFactu",
    "obligación VeriFactu 2025",
  ],
  alternates: {
    canonical: `${APP_URL}/verifactu-software-certificado`,
    languages: {
      es: `${APP_URL}/verifactu-software-certificado`,
      ca: `${APP_URL}/ca/verifactu-software-certificado`,
      eu: `${APP_URL}/eu/verifactu-software-certificado`,
      gl: `${APP_URL}/gl/verifactu-software-certificado`,
      en: `${APP_URL}/en/verifactu-software-certificado`,
      "x-default": `${APP_URL}/verifactu-software-certificado`,
    },
  },
  openGraph: {
    title: "Software VeriFactu Certificado AEAT — YouWhole",
    description: "Cumple con la obligación VeriFactu desde el primer día. Incluido en todos los planes de YouWhole.",
    url: `${APP_URL}/verifactu-software-certificado`,
  },
};

const JSONLD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué es VeriFactu?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española (AEAT). Desde 2025, todo software de facturación usado por empresas y autónomos debe estar certificado VeriFactu para garantizar la integridad e inalterabilidad de las facturas emitidas.",
      },
    },
    {
      "@type": "Question",
      name: "¿Es obligatorio usar un software con VeriFactu?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. El Reglamento de Facturación aprobado en 2023 obliga a todos los empresarios y profesionales en España a usar sistemas de facturación que cumplan con VeriFactu. El incumplimiento puede conllevar sanciones de Hacienda.",
      },
    },
    {
      "@type": "Question",
      name: "¿YouWhole está certificado por la AEAT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. YouWhole está certificado para el envío de registros de facturación a la AEAT mediante el sistema VeriFactu. Cada factura emitida genera automáticamente el registro correspondiente y lo envía a Hacienda.",
      },
    },
    {
      "@type": "Question",
      name: "¿Tengo que hacer algo especial para activar VeriFactu en YouWhole?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. VeriFactu está activo por defecto en todas las cuentas de YouWhole desde el momento del registro. No necesitas configurar nada ni contratar un módulo adicional.",
      },
    },
  ],
};

export default function VerifactuPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_FAQ) }} />
      <VerifactuContent />
    </>
  );
}
