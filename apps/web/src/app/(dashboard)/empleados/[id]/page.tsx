import type { Metadata } from "next";
import { EmployeeDetailView } from "@/components/employees/employee-detail";

export const metadata: Metadata = { title: "Ficha empleado — ERP SaaS" };

export default function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <EmployeeDetailView id={params.id} />;
}
