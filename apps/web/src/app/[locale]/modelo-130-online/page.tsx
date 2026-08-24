import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { Modelo130Content } from "@/components/marketing/pages/modelo130-content";

export const generateMetadata = createSatelliteMetadata("modelo-130-online", "modelo130");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/modelo-130-online");
  return <Modelo130Content />;
}
