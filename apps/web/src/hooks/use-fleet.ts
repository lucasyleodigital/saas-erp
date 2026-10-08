"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  companyId: string;
  tipo: "ITV" | "REVISION" | "SEGURO" | "AVERIA" | "CAMBIO_ACEITE" | "NEUMATICOS" | "FRENOS" | "OTRO";
  descripcion: string | null;
  fecha: string;
  km: number | null;
  coste: string | number | null;
  proveedor: string | null;
  proximaRevision: string | null;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  companyId: string;
  matricula: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  transportistaNombre: string | null;
  transportistaNif: string | null;
  itvDate: string | null;
  seguroDate: string | null;
  notas: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  maintenances?: VehicleMaintenance[];
  _count?: { maintenances: number };
}

export const MAINTENANCE_LABELS: Record<VehicleMaintenance["tipo"], string> = {
  ITV: "ITV",
  REVISION: "Revisión",
  SEGURO: "Seguro",
  AVERIA: "Avería",
  CAMBIO_ACEITE: "Cambio de aceite",
  NEUMATICOS: "Neumáticos",
  FRENOS: "Frenos",
  OTRO: "Otro",
};

export function getExpiryStatus(dateStr: string | null): "ok" | "warn" | "expired" | "none" {
  if (!dateStr) return "none";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "expired";
  if (diffDays < 30) return "warn";
  return "ok";
}

export function useVehicles(params?: Record<string, any>) {
  return useQuery<Vehicle[]>({
    queryKey: ["fleet", params],
    queryFn: () => api.get("/fleet", { params }).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery<Vehicle>({
    queryKey: ["fleet-vehicle", id],
    queryFn: () => api.get(`/fleet/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/fleet", data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Vehículo creado");
      qc.invalidateQueries({ queryKey: ["fleet"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al crear el vehículo");
    },
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.patch(`/fleet/${id}`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      toast.success("Vehículo actualizado");
      qc.invalidateQueries({ queryKey: ["fleet"] });
      qc.invalidateQueries({ queryKey: ["fleet-vehicle", id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al actualizar");
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/fleet/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Vehículo eliminado");
      qc.invalidateQueries({ queryKey: ["fleet"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al eliminar");
    },
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, ...data }: any) =>
      api.post(`/fleet/${vehicleId}/maintenances`, data).then((r) => r.data),
    onSuccess: (_, { vehicleId }) => {
      toast.success("Mantenimiento registrado");
      qc.invalidateQueries({ queryKey: ["fleet"] });
      qc.invalidateQueries({ queryKey: ["fleet-vehicle", vehicleId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al registrar el mantenimiento");
    },
  });
}

export function useUpdateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, id, ...data }: any) =>
      api.patch(`/fleet/${vehicleId}/maintenances/${id}`, data).then((r) => r.data),
    onSuccess: (_, { vehicleId }) => {
      toast.success("Mantenimiento actualizado");
      qc.invalidateQueries({ queryKey: ["fleet"] });
      qc.invalidateQueries({ queryKey: ["fleet-vehicle", vehicleId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al actualizar");
    },
  });
}

export function useDeleteMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, id }: { vehicleId: string; id: string }) =>
      api.delete(`/fleet/${vehicleId}/maintenances/${id}`).then((r) => r.data),
    onSuccess: (_, { vehicleId }) => {
      toast.success("Mantenimiento eliminado");
      qc.invalidateQueries({ queryKey: ["fleet"] });
      qc.invalidateQueries({ queryKey: ["fleet-vehicle", vehicleId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al eliminar");
    },
  });
}
