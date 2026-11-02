import type { Metadata } from "next";
import { FacturacionPymesContent } from "@/components/marketing/pages/facturacion-pymes-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: { absolute: "Software de facturación para pymes con VeriFactu — YouWhole" },
  description:
    "Programa de facturación para pymes adaptado a VeriFactu, con plan gratuito y facturas ilimitadas desde 29 €/mes con IVA. Contabilidad, CRM, inventario y banco en el mismo programa.",
  keywords: [
    "software facturación pymes",
    "programa de facturación para pymes",
    "programa facturación España",
    "programa facturación gratis",
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
    title: "Software de facturación para pymes — YouWhole",
    description: "Facturas adaptadas a VeriFactu en cinco idiomas, con contabilidad, CRM, inventario y banco. Plan gratuito para empezar.",
    url: `${APP_URL}/software-facturacion-pymes`,
  },
};

export default function SoftwareFacturacionPymesPage() {
  return <FacturacionPymesContent />;
}
