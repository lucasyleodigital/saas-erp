import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { NominasContent } from "@/components/marketing/pages/nominas-content";

export const generateMetadata = createSatelliteMetadata("software-nominas-pymes", "nominas");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/software-nominas-pymes");
  return <NominasContent />;
}
