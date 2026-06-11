import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useNotifications(params?: { unreadOnly?: boolean; page?: number }) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => api.get("/notifications", { params }).then((r) => r.data),
    staleTime: 30 * 1000, // refresh faster for notifications
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.get("/notifications/unread-count").then((r) => r.data as number),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // poll every minute
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all").then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Todas las notificaciones marcadas como leídas");
    },
  });
}

export function useClearRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/notifications/clear-read").then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notificaciones leídas eliminadas");
    },
  });
}
