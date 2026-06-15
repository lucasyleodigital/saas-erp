import type { Metadata } from "next";
import { EmployeeDetailView } from "@/components/employees/employee-detail";

export const metadata: Metadata = { title: "Ficha empleado — ERP SaaS" };

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployeeDetailView id={id} />;
}
