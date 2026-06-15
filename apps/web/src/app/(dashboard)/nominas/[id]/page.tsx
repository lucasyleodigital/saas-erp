import type { Metadata } from "next";
import { PayslipDetail } from "@/components/payroll/payslip-detail";

export const metadata: Metadata = { title: "Detalle nómina — ERP SaaS" };

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PayslipDetail id={id} />;
}
