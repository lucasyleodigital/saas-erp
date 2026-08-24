import type { Metadata } from "next";
import { Modelo130Content } from "@/components/marketing/pages/modelo130-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

const JSONLD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué es el Modelo 130?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "El Modelo 130 es la declaración trimestral del IRPF para autónomos en estimación directa. Se presenta en enero, abril, julio y octubre ante la Agencia Tributaria y sirve para liquidar los pagos fraccionados del IRPF.",
      },
    },
    {
      "@type": "Question",
      name: "¿Quién tiene que presentar el Modelo 130?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Todos los autónomos en estimación directa (normal o simplificada) que no tengan al menos el 70% de sus ingresos con retención IRPF. Si tus clientes son particulares o empresas que no te aplican retención, debes presentar el Modelo 130.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo calcula YouWhole el Modelo 130?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "YouWhole suma automáticamente todos tus ingresos y gastos del trimestre, calcula el 20% de IRPF sobre el beneficio neto, resta las retenciones ya aplicadas y te da el importe exacto a pagar. No necesitas hacer ningún cálculo manual.",
      },
    },
    {
      "@type": "Question",
      name: "¿YouWhole presenta el Modelo 130 en la AEAT por mí?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "YouWhole genera todos los datos necesarios para presentar el Modelo 130. La presentación final ante la AEAT la realizas tú desde la Sede Electrónica o tu asesor con los datos que te proporcionamos. Estamos trabajando en la presentación directa.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "Modelo 130 Online para Autónomos — YouWhole",
  description:
    "Calcula y prepara el Modelo 130 de forma automática con YouWhole. Suma ingresos, gastos y retenciones del trimestre sin errores. Gratis para autónomos.",
  keywords: [
    "modelo 130 online",
    "modelo 130 autónomos",
    "calcular modelo 130",
    "modelo 130 IRPF autónomos",
    "declaración trimestral autónomos",
    "pagos fraccionados IRPF autónomos",
    "modelo 130 estimación directa",
  ],
  alternates: {
    canonical: `${APP_URL}/modelo-130-online`,
    languages: {
      es: `${APP_URL}/modelo-130-online`,
      ca: `${APP_URL}/ca/modelo-130-online`,
      eu: `${APP_URL}/eu/modelo-130-online`,
      gl: `${APP_URL}/gl/modelo-130-online`,
      en: `${APP_URL}/en/modelo-130-online`,
      "x-default": `${APP_URL}/modelo-130-online`,
    },
  },
  openGraph: {
    title: "Modelo 130 Online para Autónomos — YouWhole",
    description: "Calcula el Modelo 130 automáticamente. Sin errores, sin cálculos manuales. Incluido en todos los planes.",
    url: `${APP_URL}/modelo-130-online`,
  },
};

export default function Modelo130Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_FAQ) }} />
      <Modelo130Content />
    </>
  );
}
