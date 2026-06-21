import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const clientKeys = {
  all: ["clients"] as const,
  list: (params?: Record<string, unknown>) => [...clientKeys.all, "list", params] as const,
  detail: (id: string) => [...clientKeys.all, "detail", id] as const,
};

export function useClients(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () =>
      api.get("/clients", { params }).then((r) => r.data),
    refetchOnMount: true,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => api.get(`/clients/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/clients", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      toast.success("Cliente creado correctamente");
    },
    onError: () => toast.error("Error al crear el cliente"),
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`/clients/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      toast.success("Cliente actualizado");
    },
    onError: () => toast.error("Error al actualizar el cliente"),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      toast.success("Cliente eliminado");
    },
    onError: () => toast.error("Error al eliminar el cliente"),
  });
}

export function useGeneratePortalToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api.post(`/portal/manage/${clientId}/token`, {}).then((r) => r.data as { id: string; name: string; portalToken: string }),
    onSuccess: (_, clientId) => {
      qc.invalidateQueries({ queryKey: clientKeys.detail(clientId) });
      qc.invalidateQueries({ queryKey: clientKeys.all });
    },
    onError: () => toast.error("Error al generar el enlace del portal"),
  });
}

export function useRevokePortalToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api.post(`/portal/manage/${clientId}/revoke`, {}).then((r) => r.data),
    onSuccess: (_, clientId) => {
      qc.invalidateQueries({ queryKey: clientKeys.detail(clientId) });
      qc.invalidateQueries({ queryKey: clientKeys.all });
    },
    onError: () => toast.error("Error al revocar el enlace"),
  });
}
