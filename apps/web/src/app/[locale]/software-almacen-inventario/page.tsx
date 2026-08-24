import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { AlmacenContent } from "@/components/marketing/pages/almacen-content";

export const generateMetadata = createSatelliteMetadata("software-almacen-inventario", "almacen");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/software-almacen-inventario");
  return <AlmacenContent />;
}
