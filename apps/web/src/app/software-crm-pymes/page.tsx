import type { Metadata } from "next";
import { CrmContent } from "@/components/marketing/pages/crm-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";
const SLUG = "software-crm-pymes";

export const metadata: Metadata = {
  title: "Software CRM para Pymes España — YouWhole",
  description:
    "CRM integrado con facturación para pymes. Clientes, leads, pipeline de ventas y presupuestos en una plataforma. Desde 29 EUR/mes.",
  keywords: [
    "software CRM pymes España",
    "CRM autónomos",
    "CRM integrado facturación",
    "gestión clientes pymes",
    "pipeline ventas pymes",
    "CRM leads España",
    "software ventas pymes",
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
    title: "Software CRM para Pymes — YouWhole",
    description: "Gestiona clientes, leads y ventas integrado con tu facturación. Sin herramientas externas.",
    url: `${APP_URL}/${SLUG}`,
  },
};

export default function SoftwareCrmPage() {
  return <CrmContent />;
}
