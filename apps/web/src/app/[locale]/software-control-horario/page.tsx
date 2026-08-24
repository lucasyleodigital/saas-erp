import { redirect } from "next/navigation";
import { createSatelliteMetadata } from "@/lib/satellite-metadata";
import { ControlHorarioContent } from "@/components/marketing/pages/control-horario-content";

export const generateMetadata = createSatelliteMetadata("software-control-horario", "controlHorario");

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "es") redirect("/software-control-horario");
  return <ControlHorarioContent />;
}
