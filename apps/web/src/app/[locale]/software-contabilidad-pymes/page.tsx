import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { ContabilidadContent } from "@/components/marketing/pages/contabilidad-content";

export const generateMetadata = createSatelliteMetadata("software-contabilidad-pymes", "contabilidad");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/software-contabilidad-pymes");
  return <ContabilidadContent />;
}
