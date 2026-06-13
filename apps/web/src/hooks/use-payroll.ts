"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Payroll {
  id: string;
  companyId: string;
  employeeId: string;
  year: number;
  month: number;
  baseSalary: number;
  overtimePay: number;
  bonuses: number;
  grossSalary: number;
  ssEmployeeRate: number;
  ssEmployerRate: number;
  ssEmployee: number;
  ssEmployer: number;
  irpfRate: number;
  irpfAmount: number;
  otherDeductions: number;
  netSalary: number;
  totalCost: number;
  status: "DRAFT" | "APPROVED" | "PAID";
  paymentDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    department: string | null;
    bankAccount: string | null;
    bankHolder: string | null;
    nif: string | null;
    email?: string;
    socialSecurityNumber?: string;
    contractType?: string;
    startDate?: string;
  };
  company?: {
    name: string;
    legalName: string | null;
    cif: string | null;
    address: string | null;
    city: string | null;
  };
}

export interface PayrollStats {
  total: number;
  draft: number;
  approved: number;
  paid: number;
  totalNet: number;
  totalGross: number;
  totalCost: number;
  totalIRPF: number;
  totalSS: number;
}

const _STATUS_CONFIG = {
  DRAFT:    { label: "Borrador",  color: "bg-gray-100 text-gray-700" },
  APPROVED: { label: "Aprobada",  color: "bg-blue-100 text-blue-700" },
  PAID:     { label: "Pagada",    color: "bg-green-100 text-green-700" },
};
export const PAYROLL_STATUS_CONFIG = _STATUS_CONFIG as Record<string, { label: string; color: string }>;
export function getPayrollStatusConfig(s: string) {
  return PAYROLL_STATUS_CONFIG[s] ?? _STATUS_CONFIG.DRAFT;
}

export const MONTHS_ES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ── Queries ──────────────────────────────────────────────────

export function usePayrolls(year: number, month: number) {
  return useQuery<Payroll[]>({
    queryKey: ["payrolls", year, month],
    queryFn: () => api.get(`/payrolls?year=${year}&month=${month}`).then(r => r.data),
    staleTime: 30_000,
  });
}

export function usePayroll(id: string) {
  return useQuery<Payroll>({
    queryKey: ["payroll", id],
    queryFn: () => api.get(`/payrolls/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function usePayrollStats(year: number, month: number) {
  return useQuery<PayrollStats>({
    queryKey: ["payroll-stats", year, month],
    queryFn: () => api.get(`/payrolls/stats?year=${year}&month=${month}`).then(r => r.data),
    staleTime: 30_000,
  });
}

export function useModelo111(year: number, quarter: number) {
  return useQuery({
    queryKey: ["modelo-111", year, quarter],
    queryFn: () => api.get(`/payrolls/modelo-111?year=${year}&quarter=${quarter}`).then(r => r.data),
  });
}

export function useModelo190(year: number) {
  return useQuery({
    queryKey: ["modelo-190", year],
    queryFn: () => api.get(`/payrolls/modelo-190?year=${year}`).then(r => r.data),
  });
}

// ── Mutations ────────────────────────────────────────────────

export function useGeneratePayrolls() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { year: number; month: number }) =>
      api.post("/payrolls/generate", dto).then(r => r.data as Payroll[]),
    onSuccess: (_data: Payroll[], vars) => {
      qc.invalidateQueries({ queryKey: ["payrolls", vars.year, vars.month] });
      qc.invalidateQueries({ queryKey: ["payroll-stats"] });
    },
  });
}

export function useUpdatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; overtimePay?: number; bonuses?: number; otherDeductions?: number; irpfRate?: number; notes?: string }) =>
      api.patch(`/payrolls/${id}`, dto).then(r => r.data as Payroll),
    onSuccess: (data: Payroll) => {
      qc.invalidateQueries({ queryKey: ["payrolls"] });
      qc.invalidateQueries({ queryKey: ["payroll", data.id] });
      qc.invalidateQueries({ queryKey: ["payroll-stats"] });
    },
  });
}

export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/payrolls/${id}/approve`, {}).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payrolls"] });
      qc.invalidateQueries({ queryKey: ["payroll-stats"] });
    },
  });
}

export function useMarkPayrollPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentDate }: { id: string; paymentDate?: string }) =>
      api.post(`/payrolls/${id}/pay`, { paymentDate }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payrolls"] });
      qc.invalidateQueries({ queryKey: ["payroll-stats"] });
    },
  });
}

export function useDeletePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/payrolls/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payrolls"] });
      qc.invalidateQueries({ queryKey: ["payroll-stats"] });
    },
  });
}
