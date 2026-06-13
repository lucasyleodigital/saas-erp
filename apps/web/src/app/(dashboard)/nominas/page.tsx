import type { Metadata } from "next";
import { PayrollView } from "@/components/payroll/payroll-view";

export const metadata: Metadata = { title: "Nóminas — ERP SaaS" };

export default function NominasPage() {
  return <PayrollView />;
}
