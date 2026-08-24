import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { FacturacionPymesContent } from "@/components/marketing/pages/facturacion-pymes-content";

export const generateMetadata = createSatelliteMetadata("software-facturacion-pymes", "facturacionPymes");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/software-facturacion-pymes");
  return <FacturacionPymesContent />;
}
