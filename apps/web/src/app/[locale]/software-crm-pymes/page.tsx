import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { CrmContent } from "@/components/marketing/pages/crm-content";

export const generateMetadata = createSatelliteMetadata("software-crm-pymes", "crm");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/software-crm-pymes");
  return <CrmContent />;
}
