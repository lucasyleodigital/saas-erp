"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  userId: string;
  companyId: string;
  role: "OWNER" | "ADMIN" | "ACCOUNTANT" | "SALES" | "EMPLOYEE";
  isDefault: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    lastLoginAt: string | null;
  };
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "ACCOUNTANT" | "SALES" | "EMPLOYEE";
  token: string;
  expiresAt: string;
  createdAt: string;
}

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  ACCOUNTANT: "Contable",
  SALES: "Ventas",
  EMPLOYEE: "Empleado",
};

export const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ACCOUNTANT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  SALES: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  EMPLOYEE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function useMembers() {
  return useQuery<{ members: TeamMember[]; invitations: PendingInvitation[] }>({
    queryKey: ["members"],
    queryFn: () => api.get("/companies/members").then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      api.post("/companies/invite", data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Invitación enviada correctamente");
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Error al enviar la invitación";
      toast.error(msg);
    },
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/companies/members/${id}/role`, { role }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Rol actualizado");
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al cambiar el rol");
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/companies/members/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Miembro eliminado");
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al eliminar el miembro");
    },
  });
}

export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/companies/invitations/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Invitación cancelada");
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: () => toast.error("Error al cancelar la invitación"),
  });
}
