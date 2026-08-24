import type { Metadata } from "next";
import { FacturacionPymesContent } from "@/components/marketing/pages/facturacion-pymes-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software de Facturación para Pymes — YouWhole",
  description:
    "Software de facturación para pymes españolas con VeriFactu certificado, contabilidad PGC, nóminas, CRM y gestión de proyectos. Todo en uno. Desde 29 EUR/mes sin permanencia.",
  keywords: [
    "software facturación pymes",
    "programa facturación España",
    "software gestión pymes",
    "ERP pymes España",
    "facturación electrónica pymes",
    "software contabilidad pymes",
    "programa nóminas pymes",
  ],
  alternates: {
    canonical: `${APP_URL}/software-facturacion-pymes`,
    languages: {
      es: `${APP_URL}/software-facturacion-pymes`,
      ca: `${APP_URL}/ca/software-facturacion-pymes`,
      eu: `${APP_URL}/eu/software-facturacion-pymes`,
      gl: `${APP_URL}/gl/software-facturacion-pymes`,
      en: `${APP_URL}/en/software-facturacion-pymes`,
      "x-default": `${APP_URL}/software-facturacion-pymes`,
    },
  },
  openGraph: {
    title: "Software de Facturación para Pymes — YouWhole",
    description: "Todo lo que necesita tu pyme: facturación VeriFactu, nóminas, CRM, contabilidad PGC y más. Desde 29 EUR/mes.",
    url: `${APP_URL}/software-facturacion-pymes`,
  },
};

export default function SoftwareFacturacionPymesPage() {
  return <FacturacionPymesContent />;
}
