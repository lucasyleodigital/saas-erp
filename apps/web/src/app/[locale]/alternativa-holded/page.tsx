import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { HoldedContent } from "@/components/marketing/pages/holded-content";

export const generateMetadata = createSatelliteMetadata("alternativa-holded", "holded");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/alternativa-holded");
  return <HoldedContent />;
}
