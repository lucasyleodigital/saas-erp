import type { Metadata } from "next";
import { ClientDetail } from "@/components/clients/client-detail";

export const metadata: Metadata = { title: "Detalle de cliente — ERP SaaS" };

export default function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ClientDetail id={params.id} />;
}
