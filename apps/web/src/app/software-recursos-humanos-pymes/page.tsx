import type { Metadata } from "next";
import { RrhhContent } from "@/components/marketing/pages/rrhh-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software de Recursos Humanos para Pymes — YouWhole",
  description:
    "Gestiona empleados, nóminas, contratos, vacaciones y control horario en una sola plataforma. Software RRHH para pymes español, sin complicaciones. Desde 29 EUR/mes.",
  keywords: [
    "software recursos humanos pymes",
    "programa nóminas pymes España",
    "gestión empleados pymes",
    "software RRHH España",
    "control horario empleados",
    "gestión vacaciones empleados",
    "software nóminas autónomos",
  ],
  alternates: {
    canonical: `${APP_URL}/software-recursos-humanos-pymes`,
    languages: {
      es: `${APP_URL}/software-recursos-humanos-pymes`,
      ca: `${APP_URL}/ca/software-recursos-humanos-pymes`,
      eu: `${APP_URL}/eu/software-recursos-humanos-pymes`,
      gl: `${APP_URL}/gl/software-recursos-humanos-pymes`,
      en: `${APP_URL}/en/software-recursos-humanos-pymes`,
      "x-default": `${APP_URL}/software-recursos-humanos-pymes`,
    },
  },
  openGraph: {
    title: "Software RRHH para Pymes — YouWhole",
    description: "Nóminas, contratos, vacaciones y control horario integrados con tu facturación. Todo en uno.",
    url: `${APP_URL}/software-recursos-humanos-pymes`,
  },
};

export default function SoftwareRRHHPage() {
  return <RrhhContent />;
}
