import type { Metadata } from "next";
import { ContabilidadContent } from "@/components/marketing/pages/contabilidad-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

const JSONLD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿YouWhole lleva la contabilidad automáticamente?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Cada factura emitida y recibida genera automáticamente el asiento contable correspondiente según el Plan General Contable español. No necesitas introducir los asientos manualmente.",
      },
    },
    {
      "@type": "Question",
      name: "¿Necesito saber contabilidad para usar YouWhole?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. YouWhole genera todos los asientos contables de forma automática. Tú solo introduces las facturas y cobros, y el sistema hace el resto. Para casos complejos, puedes dar acceso a tu asesor contable.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo dar acceso a mi gestor o asesor contable?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. YouWhole permite invitar a tu asesor con rol de Contable. Tendrá acceso a la contabilidad, facturas y datos fiscales sin poder modificar configuraciones sensibles de la empresa.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cumple con el Plan General Contable español?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. YouWhole genera asientos según el PGC (Plan General Contable) español vigente, con los códigos de cuenta correspondientes para cada tipo de operación: ventas, compras, IVA, IRPF y gastos.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "Software de Contabilidad para Pymes España — YouWhole",
  description:
    "Contabilidad automática según el PGC español. Asientos automáticos, balance, cuenta de pérdidas y ganancias, e IVA integrado con facturación. Para pymes y autónomos. Desde 29 EUR/mes.",
  keywords: [
    "software contabilidad pymes España",
    "programa contabilidad autónomos",
    "contabilidad PGC automática",
    "software contable pymes",
    "contabilidad online pymes España",
    "programa asientos contables pymes",
    "software contabilidad ERP España",
  ],
  alternates: {
    canonical: `${APP_URL}/software-contabilidad-pymes`,
    languages: {
      es: `${APP_URL}/software-contabilidad-pymes`,
      ca: `${APP_URL}/ca/software-contabilidad-pymes`,
      eu: `${APP_URL}/eu/software-contabilidad-pymes`,
      gl: `${APP_URL}/gl/software-contabilidad-pymes`,
      en: `${APP_URL}/en/software-contabilidad-pymes`,
      "x-default": `${APP_URL}/software-contabilidad-pymes`,
    },
  },
  openGraph: {
    title: "Software Contabilidad Pymes — YouWhole",
    description: "Asientos automáticos según el PGC español. Integrado con facturación VeriFactu. Sin conocimientos contables.",
    url: `${APP_URL}/software-contabilidad-pymes`,
  },
};

export default function SoftwareContabilidadPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_FAQ) }} />
      <ContabilidadContent />
    </>
  );
}
