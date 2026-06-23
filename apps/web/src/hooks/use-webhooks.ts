import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: () => api.get("/webhooks").then((r) => r.data),
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/webhooks", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook creado");
    },
    onError: () => toast.error("Error al crear el webhook"),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/webhooks/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook eliminado");
    },
    onError: () => toast.error("Error al eliminar el webhook"),
  });
}
