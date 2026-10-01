import type { Metadata } from "next";
import { RrhhContent } from "@/components/marketing/pages/rrhh-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";
const SLUG = "software-recursos-humanos-pymes";

export const metadata: Metadata = {
  title: "Software de Recursos Humanos para Pymes — YouWhole",
  description:
    "Gestiona empleados, nóminas, contratos, vacaciones y control horario en una sola plataforma. Software RRHH para pymes. Desde 29 EUR/mes.",
  keywords: [
    "software recursos humanos pymes",
    "software RRHH España",
    "gestión empleados pymes",
    "nóminas online pymes",
    "control horario empleados",
    "contratos laborales online",
    "portal del empleado",
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
    title: "Software RRHH para Pymes — YouWhole",
    description: "Nóminas, contratos, vacaciones y control horario integrados con tu facturación. Todo en uno.",
    url: `${APP_URL}/${SLUG}`,
  },
};

export default function SoftwareRrhhPage() {
  return <RrhhContent />;
}
