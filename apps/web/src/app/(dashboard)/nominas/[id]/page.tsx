import type { Metadata } from "next";
import { PayslipDetail } from "@/components/payroll/payslip-detail";

export const metadata: Metadata = { title: "Detalle nómina — ERP SaaS" };

export default function PayslipPage({ params }: { params: { id: string } }) {
  return <PayslipDetail id={params.id} />;
}
