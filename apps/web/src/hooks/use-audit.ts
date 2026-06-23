import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAuditLog(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: () => api.get("/audit", { params }).then((r) => r.data),
  });
}
