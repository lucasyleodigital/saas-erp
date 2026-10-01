import type { Metadata } from "next";
import { ControlHorarioContent } from "@/components/marketing/pages/control-horario-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";
const SLUG = "software-control-horario";

export const metadata: Metadata = {
  title: "Software de Control Horario para Empresas — YouWhole",
  description:
    "Control horario obligatorio para empresas españolas. Fichaje por GPS, QR o web. Integrado con nóminas y proyectos. Cumple el RD 8/2019. Desde 29 EUR/mes.",
  keywords: [
    "software control horario",
    "control horario obligatorio España",
    "fichaje empleados online",
    "RD 8/2019 control horario",
    "registro jornada laboral",
    "fichaje GPS empleados",
    "control horario pymes",
  ],
  alternates: {
    canonical: `${APP_URL}/${SLUG}`,
    languages: {
      es: `${APP_URL}/${SLUG}`,
      ca: `${APP_URL}/ca/${SLUG}`,
      eu: `${APP_URL}/eu/${SLUG}`,
      gl: `${APP_URL}/gl/${SLUG}`,
      en: `${APP_URL}/en/${SLUG}`,
      "x-default": `${APP_URL}/${SLUG}`,
    },
  },
  openGraph: {
    title: "Software Control Horario Empresas — YouWhole",
    description: "Fichaje GPS, QR y web. Cumple el RD 8/2019 sin complicaciones. Integrado con nóminas y proyectos.",
    url: `${APP_URL}/${SLUG}`,
  },
};

export default function SoftwareControlHorarioPage() {
  return <ControlHorarioContent />;
}
