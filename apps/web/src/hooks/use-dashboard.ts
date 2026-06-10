import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.get("/dashboard/stats").then((r) => r.data),
    refetchInterval: 60_000,
  });
}

export function useRevenueChart() {
  return useQuery({
    queryKey: ["dashboard", "revenue-chart"],
    queryFn: () => api.get("/dashboard/revenue-chart").then((r) => r.data),
  });
}
