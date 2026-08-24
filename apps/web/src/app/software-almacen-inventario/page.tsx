import type { Metadata } from "next";
import { AlmacenContent } from "@/components/marketing/pages/almacen-content";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Software de Almacén e Inventario para Pymes — YouWhole",
  description:
    "Controla tu stock en tiempo real, gestiona proveedores y genera pedidos automáticos. Software de almacén e inventario integrado con facturación. Desde 29 EUR/mes.",
  keywords: [
    "software almacén pymes",
    "programa gestión inventario España",
    "control stock pymes",
    "software inventario proveedores",
    "gestión almacén ERP España",
    "programa stock pymes",
    "control inventario tiempo real",
  ],
  alternates: {
    canonical: `${APP_URL}/software-almacen-inventario`,
    languages: {
      es: `${APP_URL}/software-almacen-inventario`,
      ca: `${APP_URL}/ca/software-almacen-inventario`,
      eu: `${APP_URL}/eu/software-almacen-inventario`,
      gl: `${APP_URL}/gl/software-almacen-inventario`,
      en: `${APP_URL}/en/software-almacen-inventario`,
      "x-default": `${APP_URL}/software-almacen-inventario`,
    },
  },
  openGraph: {
    title: "Software Almacén e Inventario Pymes — YouWhole",
    description: "Stock en tiempo real, pedidos automáticos y gestión de proveedores integrados con tu facturación.",
    url: `${APP_URL}/software-almacen-inventario`,
  },
};

export default function SoftwareAlmacenPage() {
  return <AlmacenContent />;
}
