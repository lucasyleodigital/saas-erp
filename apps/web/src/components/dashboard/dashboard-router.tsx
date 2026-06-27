"use client";

import { useUser } from "@/hooks/use-user";
import { EmployeeDashboard } from "./employee-dashboard";

export function DashboardRouter({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) return null;

  if (user?.role === "EMPLOYEE") {
    return <EmployeeDashboard />;
  }

  return <>{children}</>;
}
