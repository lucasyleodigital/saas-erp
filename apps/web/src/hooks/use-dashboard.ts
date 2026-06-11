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

export function useRecentInvoices() {
  return useQuery({
    queryKey: ["dashboard", "recent-invoices"],
    queryFn: () => api.get("/dashboard/recent-invoices").then((r) => r.data),
    refetchInterval: 60_000,
  });
}

export function useTopClients() {
  return useQuery({
    queryKey: ["dashboard", "top-clients"],
    queryFn: () => api.get("/dashboard/top-clients").then((r) => r.data),
    refetchInterval: 120_000,
  });
}
