import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface CurrentUser {
  sub: string;
  email: string;
  companyId: string;
  role: "OWNER" | "ADMIN" | "ACCOUNTANT" | "SALES" | "EMPLOYEE" | "SUPER_ADMIN";
}

export function useUser() {
  return useQuery<CurrentUser>({
    queryKey: ["auth", "me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
    staleTime: 5 * 60 * 1000, // 5 min — role doesn't change often
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    }) => api.put("/users/profile", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Perfil actualizado");
    },
    onError: () => toast.error("Error al actualizar el perfil"),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put("/users/password", data).then((r) => r.data),
    onSuccess: () => toast.success("Contraseña cambiada correctamente"),
    onError: (err: any) =>
      toast.error(
        err.response?.data?.message ?? "Error al cambiar la contraseña"
      ),
  });
}
