import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PlanUsage {
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  limits: {
    maxUsers: number;
    maxClients: number;
    maxInvoicesPerMonth: number;
    maxQuotesPerMonth: number;
    maxProducts: number;
    maxAutomations: number;
    canSendEmails: boolean;
    hasAccounting: boolean;
    hasVeriFactu: boolean;
    hasApiAccess: boolean;
  };
  usage: {
    users: number;
    clients: number;
    invoicesThisMonth: number;
    quotesThisMonth: number;
    products: number;
    automations: number;
  };
}

export function usePlanUsage() {
  return useQuery<PlanUsage>({
    queryKey: ["plan", "usage"],
    queryFn: () => api.get("/plans/usage").then((r) => r.data),
    staleTime: 60_000,
  });
}

/** Returns true if the given feature is allowed under the current plan */
export function useFeatureAllowed(feature: keyof PlanUsage["limits"]) {
  const { data } = usePlanUsage();
  if (!data) return true; // optimistic while loading
  return Boolean(data.limits[feature]);
}

/** Returns true if user can still create more of a countable resource (-1 = unlimited) */
export function useCanCreate(resource: keyof PlanUsage["usage"], limitKey: keyof PlanUsage["limits"]) {
  const { data } = usePlanUsage();
  if (!data) return true;
  const limit = data.limits[limitKey] as number;
  if (limit === -1) return true;
  const used = data.usage[resource] as number;
  return used < limit;
}
