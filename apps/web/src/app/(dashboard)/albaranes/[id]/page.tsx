import type { Metadata } from "next";
import { DeliveryNoteDetailView } from "@/components/delivery-notes/delivery-note-detail";

export const metadata: Metadata = { title: "Detalle albarán — ERP SaaS" };

export default function DeliveryNoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <DeliveryNoteDetailView id={params.id} />;
}
