import type { Metadata } from "next";
import { FiscalView } from "@/components/fiscal/fiscal-view";

export const metadata: Metadata = { title: "Gestión Fiscal" };

export default function FiscalPage() {
  return <FiscalView />;
}
