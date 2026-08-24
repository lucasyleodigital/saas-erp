import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { RrhhContent } from "@/components/marketing/pages/rrhh-content";

export const generateMetadata = createSatelliteMetadata("software-recursos-humanos-pymes", "rrhh");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/software-recursos-humanos-pymes");
  return <RrhhContent />;
}
