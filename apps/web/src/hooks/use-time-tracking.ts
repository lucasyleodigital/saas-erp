import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useTimeEntries(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["time-entries", params],
    queryFn: () => api.get("/time-entries", { params }).then((r) => r.data),
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/time-entries", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Entrada registrada");
    },
    onError: () => toast.error("Error al registrar"),
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/time-entries/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success("Entrada eliminada");
    },
    onError: () => toast.error("Error al eliminar"),
  });
}
