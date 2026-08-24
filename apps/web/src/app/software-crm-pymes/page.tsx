import type { Metadata } from "next";
import { CrmContent } from "@/components/marketing/pages/crm-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software CRM para Pymes España — YouWhole",
  description:
    "CRM integrado con facturación para pymes españolas. Gestiona clientes, leads, pipeline de ventas y presupuestos en una sola plataforma. Sin suscripciones extra. Desde 29 EUR/mes.",
  keywords: [
    "software CRM pymes España",
    "CRM pymes español",
    "programa CRM autónomos",
    "CRM integrado facturación",
    "gestión clientes pymes",
    "CRM ventas pymes España",
    "software ventas pymes",
  ],
  alternates: {
    canonical: `${APP_URL}/software-crm-pymes`,
    languages: {
      es: `${APP_URL}/software-crm-pymes`,
      ca: `${APP_URL}/ca/software-crm-pymes`,
      eu: `${APP_URL}/eu/software-crm-pymes`,
      gl: `${APP_URL}/gl/software-crm-pymes`,
      en: `${APP_URL}/en/software-crm-pymes`,
      "x-default": `${APP_URL}/software-crm-pymes`,
    },
  },
  openGraph: {
    title: "Software CRM para Pymes — YouWhole",
    description: "Gestiona clientes, leads y ventas integrado con tu facturación. Sin herramientas externas.",
    url: `${APP_URL}/software-crm-pymes`,
  },
};

export default function SoftwareCrmPage() {
  return <CrmContent />;
}
