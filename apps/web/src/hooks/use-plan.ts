import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type PlanKey = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export interface PlanLimitsData {
  maxUsers: number;
  maxEmployees: number;
  maxClients: number;
  maxInvoicesPerMonth: number;
  maxQuotesPerMonth: number;
  maxProducts: number;
  maxAutomations: number;
  canSendEmails: boolean;
  hasAccounting: boolean;
  hasFullAccounting: boolean;
  hasVeriFactu: boolean;
  hasApiAccess: boolean;
  hasPayroll: boolean;
  hasExpenseClaims: boolean;
  hasExpenseAdvanced: boolean;
  hasFleet: boolean;
}

export type PlanFeature = {
  [K in keyof PlanLimitsData]: PlanLimitsData[K] extends boolean ? K : never;
}[keyof PlanLimitsData];

export interface PlanUsage {
  plan: PlanKey;
  limits: PlanLimitsData;
  usage: {
    users: number;
    employees: number;
    clients: number;
    invoicesThisMonth: number;
    quotesThisMonth: number;
    products: number;
    automations: number;
  };
}

// Plan mínimo que incluye cada función (debe coincidir con PLAN_LIMITS en @saas/types)
export const FEATURE_MIN_PLAN: Record<PlanFeature, PlanKey> = {
  canSendEmails: "STARTER",
  hasAccounting: "STARTER",
  hasExpenseClaims: "STARTER",
  hasVeriFactu: "FREE",
  hasFullAccounting: "PRO",
  hasApiAccess: "PRO",
  hasPayroll: "PRO",
  hasExpenseAdvanced: "PRO",
  hasFleet: "PRO",
};

export function usePlanUsage() {
  return useQuery<PlanUsage>({
    queryKey: ["plan", "usage"],
    queryFn: () => api.get("/plans/usage").then((r) => r.data),
    staleTime: 60_000,
  });
}

/** true/false según el plan; undefined mientras carga (para no lanzar peticiones que el plan no permite) */
export function usePlanFeature(feature: PlanFeature): boolean | undefined {
  const { data } = usePlanUsage();
  return data ? Boolean(data.limits[feature]) : undefined;
}
