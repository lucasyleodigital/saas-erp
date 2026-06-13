"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nif: string | null;
  socialSecurityNumber: string | null;
  position: string | null;
  department: string | null;
  contractType: "INDEFINIDO" | "TEMPORAL" | "PRACTICAS" | "AUTONOMO" | "OBRA_SERVICIO";
  startDate: string;
  endDate: string | null;
  salary: string | number;
  bankAccount: string | null;
  bankHolder: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  workingHours: string | number;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  avatar: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  timeEntries?: TimeEntry[];
  leaveRequests?: LeaveRequest[];
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  breakMinutes: number;
  totalMinutes: number | null;
  notes: string | null;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: "VACATION" | "SICK" | "PERSONAL" | "MATERNITY" | "PATERNITY" | "OTHER";
  startDate: string;
  endDate: string;
  days: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  approvedAt: string | null;
  employee?: { id: string; firstName: string; lastName: string; position: string | null };
}

export interface EmployeeStats {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
  pendingLeaves: number;
  annualSalaryCost: number;
  monthlySalaryCost: number;
}

export const CONTRACT_LABELS: Record<string, string> = {
  INDEFINIDO:    "Indefinido",
  TEMPORAL:      "Temporal",
  PRACTICAS:     "Prácticas",
  AUTONOMO:      "Autónomo",
  OBRA_SERVICIO: "Obra y servicio",
};

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION:  "Vacaciones",
  SICK:      "Baja por enfermedad",
  PERSONAL:  "Asuntos propios",
  MATERNITY: "Maternidad",
  PATERNITY: "Paternidad",
  OTHER:     "Otra",
};

export const EMPLOYEE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: "Activo",    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  INACTIVE: { label: "Inactivo",  color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  ON_LEAVE: { label: "De baja",   color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
};

export const LEAVE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:  { label: "Pendiente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  APPROVED: { label: "Aprobada",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  REJECTED: { label: "Rechazada", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

// ─── Employees ─────────────────────────────────────────────

export function useEmployeeStats() {
  return useQuery<EmployeeStats>({
    queryKey: ["employees", "stats"],
    queryFn: () => api.get("/employees/stats").then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useEmployees(params?: Record<string, any>) {
  return useQuery<{ data: Employee[]; total: number; totalPages: number }>({
    queryKey: ["employees", params],
    queryFn: () => api.get("/employees", { params }).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery<Employee>({
    queryKey: ["employee", id],
    queryFn: () => api.get(`/employees/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/employees", data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Empleado creado");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al crear empleado");
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.patch(`/employees/${id}`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      toast.success("Empleado actualizado");
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["employee", id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al actualizar");
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Empleado eliminado");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al eliminar");
    },
  });
}

// ─── Time Entries ───────────────────────────────────────────

export function useTimeEntries(employeeId: string | undefined, params?: Record<string, any>) {
  return useQuery<{ entries: TimeEntry[]; totalMinutes: number; summary: string }>({
    queryKey: ["time-entries", employeeId, params],
    queryFn: () => api.get(`/employees/${employeeId}/time-entries`, { params }).then((r) => r.data),
    enabled: !!employeeId,
    staleTime: 15_000,
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, ...data }: any) =>
      api.post(`/employees/${employeeId}/clock-in`, data).then((r) => r.data),
    onSuccess: (_, { employeeId }) => {
      toast.success("Entrada registrada");
      qc.invalidateQueries({ queryKey: ["time-entries", employeeId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al fichar entrada");
    },
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, employeeId, ...data }: any) =>
      api.patch(`/employees/time-entries/${entryId}/clock-out`, data).then((r) => r.data),
    onSuccess: (_, { employeeId }) => {
      toast.success("Salida registrada");
      qc.invalidateQueries({ queryKey: ["time-entries", employeeId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al fichar salida");
    },
  });
}

// ─── Leave Requests ─────────────────────────────────────────

export function useLeaveRequests(params?: Record<string, any>) {
  return useQuery<LeaveRequest[]>({
    queryKey: ["leave-requests", params],
    queryFn: () => api.get("/employees/leave-requests/all", { params }).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, ...data }: any) =>
      api.post(`/employees/${employeeId}/leave-requests`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Solicitud creada");
      qc.invalidateQueries({ queryKey: ["leave-requests"] });
      qc.invalidateQueries({ queryKey: ["employee"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al crear solicitud");
    },
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      api.patch(`/employees/leave-requests/${requestId}/approve`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Solicitud aprobada");
      qc.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al aprobar");
    },
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      api.patch(`/employees/leave-requests/${requestId}/reject`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Solicitud rechazada");
      qc.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al rechazar");
    },
  });
}

export function useDeleteLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      api.delete(`/employees/leave-requests/${requestId}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Solicitud eliminada");
      qc.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al eliminar");
    },
  });
}
