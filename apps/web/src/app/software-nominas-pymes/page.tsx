import type { Metadata } from "next";
import { NominasContent } from "@/components/marketing/pages/nominas-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software de Nóminas para Pymes España — YouWhole",
  description:
    "Genera nóminas automáticas con IRPF y Seguridad Social calculados. Software de nóminas para pymes español integrado con control horario y contabilidad. Desde 29 EUR/mes.",
  keywords: [
    "software nóminas pymes España",
    "programa nóminas empleados",
    "gestión nóminas pymes",
    "nóminas automáticas España",
    "software RRHH nóminas",
    "calcular nóminas empleados",
    "programa nóminas autónomos con empleados",
  ],
  alternates: {
    canonical: `${APP_URL}/software-nominas-pymes`,
    languages: {
      es: `${APP_URL}/software-nominas-pymes`,
      ca: `${APP_URL}/ca/software-nominas-pymes`,
      eu: `${APP_URL}/eu/software-nominas-pymes`,
      gl: `${APP_URL}/gl/software-nominas-pymes`,
      en: `${APP_URL}/en/software-nominas-pymes`,
      "x-default": `${APP_URL}/software-nominas-pymes`,
    },
  },
  openGraph: {
    title: "Software Nóminas Pymes — YouWhole",
    description: "Nóminas automáticas con IRPF y SS calculados. Integrado con control horario y contabilidad.",
    url: `${APP_URL}/software-nominas-pymes`,
  },
};

export default function SoftwareNominasPage() {
  return <NominasContent />;
}
