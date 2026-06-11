import type { Metadata } from "next";
import { QuotesView } from "@/components/quotes/quotes-view";

export const metadata: Metadata = { title: "Presupuestos — ERP SaaS" };

export default function QuotesPage() {
  return <QuotesView />;
}
