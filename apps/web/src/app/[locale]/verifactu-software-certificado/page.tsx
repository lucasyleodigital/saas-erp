import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { VerifactuContent } from "@/components/marketing/pages/verifactu-content";

export const generateMetadata = createSatelliteMetadata("verifactu-software-certificado", "verifactu");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/verifactu-software-certificado");
  return <VerifactuContent />;
}
