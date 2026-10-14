import type { Metadata } from "next";
import { AccountingView } from "@/components/accounting/accounting-view";
import { PlanGate } from "@/components/billing/plan-gate";

export const metadata: Metadata = { title: "Contabilidad" };

export default function AccountingPage() {
  return (
    <PlanGate feature="hasAccounting">
      <AccountingView />
    </PlanGate>
  );
}
