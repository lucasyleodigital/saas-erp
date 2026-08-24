import type { Metadata } from "next";
import { ControlHorarioContent } from "@/components/marketing/pages/control-horario-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

const JSONLD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Es obligatorio el control horario en España?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. El Real Decreto-ley 8/2019 obliga a todas las empresas españolas a registrar la jornada laboral de sus empleados, independientemente de su tamaño. El incumplimiento puede conllevar multas de hasta 6.250 EUR por trabajador.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo fichan los empleados con YouWhole?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Los empleados pueden fichar desde la app web en el móvil con GPS activado, desde un código QR en la oficina, o el administrador puede registrar las horas manualmente. Todas las opciones quedan registradas con timestamp.",
      },
    },
    {
      "@type": "Question",
      name: "¿Se puede exportar el registro horario?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. YouWhole permite exportar el registro de horas en formato Excel o CSV, filtrado por empleado, proyecto o rango de fechas. Válido para inspecciones de trabajo y para tu gestor laboral.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "Software de Control Horario para Empresas — YouWhole",
  description:
    "Control horario obligatorio para empresas españolas. Fichaje por GPS, QR o web. Exportación para inspección de trabajo. Integrado con nóminas y proyectos. Desde 29 EUR/mes.",
  keywords: [
    "software control horario empresas",
    "control horario empleados España",
    "fichaje digital empleados",
    "registro jornada laboral obligatorio",
    "control horario GPS",
    "app control horario pymes",
    "RD 8/2019 control horario",
  ],
  alternates: {
    canonical: `${APP_URL}/software-control-horario`,
    languages: {
      es: `${APP_URL}/software-control-horario`,
      ca: `${APP_URL}/ca/software-control-horario`,
      eu: `${APP_URL}/eu/software-control-horario`,
      gl: `${APP_URL}/gl/software-control-horario`,
      en: `${APP_URL}/en/software-control-horario`,
      "x-default": `${APP_URL}/software-control-horario`,
    },
  },
  openGraph: {
    title: "Software Control Horario Empresas — YouWhole",
    description: "Fichaje GPS, QR y web. Cumple el RD 8/2019 sin complicaciones. Integrado con nóminas y proyectos.",
    url: `${APP_URL}/software-control-horario`,
  },
};

export default function ControlHorarioPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_FAQ) }} />
      <ControlHorarioContent />
    </>
  );
}
