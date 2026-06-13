import type { Metadata } from "next";
import { DeliveryNotesView } from "@/components/delivery-notes/delivery-notes-view";

export const metadata: Metadata = { title: "Albaranes — ERP SaaS" };

export default function DeliveryNotesPage() {
  return <DeliveryNotesView />;
}
