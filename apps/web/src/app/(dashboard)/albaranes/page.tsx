import type { Metadata } from "next";
import { DeliveryNotesView } from "@/components/delivery-notes/delivery-notes-view";

export const metadata: Metadata = { title: "Albaranes — YouWhole" };

export default function DeliveryNotesPage() {
  return <DeliveryNotesView />;
}
