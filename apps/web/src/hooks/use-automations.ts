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

export function useAutomationLogs(automationId?: string) {
  return useQuery({
    queryKey: ["automations", "logs", automationId],
    queryFn: () =>
      api
        .get("/automations/logs", { params: automationId ? { automationId } : undefined })
        .then((r) => r.data as {
          id: string;
          automationId: string;
          trigger: string;
          success: boolean;
          errorMessage?: string;
          payload?: Record<string, unknown>;
          createdAt: string;
          automation: { id: string; name: string; trigger: string; action: string };
        }[]),
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

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/automations/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automatización actualizada");
    },
    onError: () => toast.error("Error al actualizar"),
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

export function useTestAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/automations/${id}/test`).then((r) => r.data),
    onSuccess: (data: { success: boolean; errorMessage?: string }) => {
      if (data.success) {
        toast.success("Prueba ejecutada correctamente");
      } else {
        toast.error(`Prueba fallida: ${data.errorMessage ?? "error desconocido"}`);
      }
      qc.invalidateQueries({ queryKey: ["automations", "logs"] });
    },
    onError: () => toast.error("Error al ejecutar la prueba"),
  });
}
