import type { Metadata } from "next";
import { AlmacenContent } from "@/components/marketing/pages/almacen-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";
const SLUG = "software-almacen-inventario";

export const metadata: Metadata = {
  title: "Software de Almacén e Inventario para Pymes — YouWhole",
  description:
    "Controla tu stock en tiempo real, gestiona proveedores y genera pedidos automáticos. Integrado con facturación. Desde 29 EUR/mes.",
  keywords: [
    "software almacén pymes",
    "software inventario España",
    "control stock pymes",
    "gestión almacén online",
    "inventario integrado facturación",
    "stock tiempo real",
    "software gestión proveedores",
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
    title: "Software Almacén e Inventario Pymes — YouWhole",
    description: "Stock en tiempo real, pedidos automáticos y gestión de proveedores integrados con tu facturación.",
    url: `${APP_URL}/${SLUG}`,
  },
};

export default function SoftwareAlmacenPage() {
  return <AlmacenContent />;
}
