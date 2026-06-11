import type { Metadata } from "next";
import { ClientDetail } from "@/components/clients/client-detail";

export const metadata: Metadata = { title: "Detalle de cliente — ERP SaaS" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetail id={id} />;
}
