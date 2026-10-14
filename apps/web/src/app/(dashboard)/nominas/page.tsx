import type { Metadata } from "next";
import { PayrollView } from "@/components/payroll/payroll-view";
import { PlanGate } from "@/components/billing/plan-gate";

export const metadata: Metadata = { title: "Nóminas — YouWhole" };

export default function NominasPage() {
  return (
    <PlanGate feature="hasPayroll">
      <PayrollView />
    </PlanGate>
  );
}
