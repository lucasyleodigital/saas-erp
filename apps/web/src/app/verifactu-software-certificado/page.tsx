import type { Metadata } from "next";
import { VerifactuContent } from "@/components/marketing/pages/verifactu-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: { absolute: "Software adaptado a VeriFactu incluido en todos los planes — YouWhole" },
  description:
    "Programa de facturación adaptado a VeriFactu (RD 1007/2023), incluido en todos los planes, también en el gratuito. Prepárate antes de 2027.",
  keywords: [
    "software adaptado a VeriFactu",
    "VeriFactu AEAT",
    "software facturación VeriFactu",
    "programa VeriFactu autónomos",
    "VeriFactu pymes España",
    "facturación electrónica VeriFactu",
    "obligación VeriFactu 2027",
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
    title: "Software adaptado a VeriFactu — YouWhole",
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
        text: "VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española (AEAT). El software de facturación de empresas y autónomos debe garantizar la integridad e inalterabilidad de las facturas. Será obligatorio desde el 1 de enero de 2027 para sociedades y desde el 1 de julio de 2027 para autónomos.",
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
        text: "La AEAT no certifica ni homologa programas de facturación. La normativa exige que cada fabricante firme una declaración responsable de que su programa cumple el Reglamento VeriFactu (RD 1007/2023). YouWhole está adaptado: cada factura genera su registro con huella digital y código QR, y puede enviarse a la AEAT.",
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
