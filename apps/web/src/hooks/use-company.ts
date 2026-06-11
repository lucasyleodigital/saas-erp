import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useMyCompany() {
  return useQuery({
    queryKey: ["company", "me"],
    queryFn: () => api.get("/companies/me").then((r) => r.data),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put("/companies/me", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company"] });
      toast.success("Datos de empresa actualizados");
    },
    onError: () => toast.error("Error al actualizar la empresa"),
  });
}
