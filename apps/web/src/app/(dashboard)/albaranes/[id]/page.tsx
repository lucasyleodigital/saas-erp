import type { Metadata } from "next";
import { DeliveryNoteDetailView } from "@/components/delivery-notes/delivery-note-detail";

export const metadata: Metadata = { title: "Detalle albarán — ERP SaaS" };

export default async function DeliveryNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeliveryNoteDetailView id={id} />;
}
