import type { Metadata } from "next";
import { AccountingView } from "@/components/accounting/accounting-view";

export const metadata: Metadata = { title: "Contabilidad" };

export default function AccountingPage() {
  return <AccountingView />;
}
