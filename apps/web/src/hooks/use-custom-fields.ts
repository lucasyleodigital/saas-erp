import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useCustomFields(entity?: string) {
  return useQuery({
    queryKey: ["custom-fields", entity],
    queryFn: () => api.get("/custom-fields", { params: entity ? { entity } : {} }).then((r) => r.data),
  });
}

export function useCreateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/custom-fields", data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["custom-fields"] }); toast.success("Campo personalizado creado"); },
    onError: () => toast.error("Error al crear el campo"),
  });
}

export function useUpdateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/custom-fields/${id}`, data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["custom-fields"] }); toast.success("Campo actualizado"); },
    onError: () => toast.error("Error al actualizar"),
  });
}

export function useDeleteCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/custom-fields/${id}`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["custom-fields"] }); toast.success("Campo eliminado"); },
    onError: () => toast.error("Error al eliminar"),
  });
}
