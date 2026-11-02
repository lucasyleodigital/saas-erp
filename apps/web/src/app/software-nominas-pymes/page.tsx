import type { Metadata } from "next";
import { NominasContent } from "@/components/marketing/pages/nominas-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";
const SLUG = "software-nominas-pymes";

export const metadata: Metadata = {
  title: { absolute: "Programa de nóminas para pymes con gastos y fichajes — YouWhole" },
  description:
    "Genera las nóminas del mes con IRPF y Seguridad Social calculados, reembolsa notas de gasto en la nómina y paga con remesa SEPA. Plan Pro, 79 €/mes con IVA.",
  keywords: [
    "programa de nóminas para pymes",
    "software nóminas pymes España",
    "programa nóminas autónomos",
    "nóminas online España",
    "remesa SEPA nóminas",
    "modelo 111 nóminas",
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
    title: "Programa de nóminas para pymes — YouWhole",
    description: "Nóminas del mes en un clic, junto a tu facturación, tus gastos de empleados y los modelos 111 y 190.",
    url: `${APP_URL}/${SLUG}`,
  },
};

export default function SoftwareNominasPage() {
  return <NominasContent />;
}
