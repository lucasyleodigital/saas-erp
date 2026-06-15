import type { Metadata } from "next";
import { EmployeesView } from "@/components/employees/employees-view";

export const metadata: Metadata = { title: "Empleados — YouWhole" };

export default function EmployeesPage() {
  return <EmployeesView />;
}
