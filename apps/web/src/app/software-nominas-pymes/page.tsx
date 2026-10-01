import type { Metadata } from "next";
import { NominasContent } from "@/components/marketing/pages/nominas-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";
const SLUG = "software-nominas-pymes";

export const metadata: Metadata = {
  title: "Software de Nóminas para Pymes España — YouWhole",
  description:
    "Genera nóminas automáticas con IRPF y Seguridad Social calculados. Integrado con control horario y contabilidad. Desde 29 EUR/mes.",
  keywords: [
    "software nóminas pymes España",
    "programa nóminas autónomos",
    "nóminas online España",
    "nóminas IRPF automático",
    "gestión nóminas pymes",
    "software RRHH nóminas",
    "nóminas Seguridad Social",
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
    title: "Software Nóminas Pymes — YouWhole",
    description: "Nóminas automáticas con IRPF y SS calculados. Integrado con control horario y contabilidad.",
    url: `${APP_URL}/${SLUG}`,
  },
};

export default function SoftwareNominasPage() {
  return <NominasContent />;
}
