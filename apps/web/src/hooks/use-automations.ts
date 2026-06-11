import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useAutomations() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: () => api.get("/automations").then((r) => r.data),
  });
}

export function useAutomationStats() {
  return useQuery({
    queryKey: ["automations", "stats"],
    queryFn: () => api.get("/automations/stats").then((r) => r.data),
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/automations", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automatización creada");
    },
    onError: () => toast.error("Error al crear la automatización"),
  });
}

export function useToggleAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/automations/${id}/toggle`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/automations/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automatización eliminada");
    },
  });
}
