import type { Metadata } from "next";
import { QuotesView } from "@/components/quotes/quotes-view";

export const metadata: Metadata = { title: "Presupuestos — YouWhole" };

export default function QuotesPage() {
  return <QuotesView />;
}
