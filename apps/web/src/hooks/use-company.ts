import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useMyCompany() {
  return useQuery({
    queryKey: ["company", "me"],
    queryFn: () => api.get("/companies/me").then((r) => r.data),
  });
}

export function useMyCompanies() {
  return useQuery({
    queryKey: ["company", "my-list"],
    queryFn: () => api.get("/companies/my-list").then((r) => r.data) as Promise<
      Array<{ id: string; name: string; logo: string | null; role: string; isDefault: boolean }>
    >,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSwitchCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) =>
      api.post(`/auth/switch-company/${companyId}`).then((r) => r.data),
    onSuccess: (data) => {
      if (data?.accessToken) {
        localStorage.setItem("access_token", data.accessToken);
      }
      // Limpia toda la caché y recarga para aplicar el nuevo contexto de empresa
      qc.clear();
      window.location.reload();
    },
    onError: () => toast.error("No se pudo cambiar de empresa"),
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
