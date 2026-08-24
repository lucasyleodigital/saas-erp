import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { ErpAutonomosContent } from "@/components/marketing/pages/erp-autonomos-content";

export const generateMetadata = createSatelliteMetadata("erp-autonomos-espana", "erpAutonomos");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/erp-autonomos-espana");
  return <ErpAutonomosContent />;
}
