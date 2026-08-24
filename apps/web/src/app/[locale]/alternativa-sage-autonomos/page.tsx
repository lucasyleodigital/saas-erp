import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { SageContent } from "@/components/marketing/pages/sage-content";

export const generateMetadata = createSatelliteMetadata("alternativa-sage-autonomos", "sage");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/alternativa-sage-autonomos");
  return <SageContent />;
}
