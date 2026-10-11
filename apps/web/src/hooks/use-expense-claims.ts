"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type ExpenseCategory =
  | "TRANSPORT" | "FUEL" | "TOLLS_PARKING" | "MEALS" | "ACCOMMODATION" | "PER_DIEM"
  | "MILEAGE" | "REPRESENTATION" | "SUPPLIES" | "TRAINING" | "OTHER";
export type ExpenseStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "REIMBURSED";
export type ReimbursementMethod = "PAYROLL" | "TRANSFER" | "CASH";
export type PerDiemType = "ES_OVERNIGHT" | "ES_DAY" | "ABROAD_OVERNIGHT" | "ABROAD_DAY";

export interface PolicyWarning {
  code: string;
  message: string;
  severity: "warning" | "info";
}

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  reportId: string | null;
  category: ExpenseCategory;
  date: string;
  merchant: string | null;
  merchantNif: string | null;
  description: string | null;
  amount: string | number;
  vatRate: string | number;
  vatDeductible: boolean;
  receiptUrl: string | null;
  paidWithCompanyCard: boolean;
  distanceKm: string | number | null;
  mileageRate: string | number | null;
  origin: string | null;
  destination: string | null;
  perDiemType: PerDiemType | null;
  perDiemDays: string | number | null;
  exemptAmount: string | number;
  taxableAmount: string | number;
  projectId: string | null;
  vehicleId: string | null;
  status: ExpenseStatus;
  rejectionReason: string | null;
  policyWarnings: PolicyWarning[] | null;
  fiscalExpenseId: string | null;
  employee?: { id: string; firstName: string; lastName: string };
  project?: { id: string; name: string; color: string } | null;
  vehicle?: { id: string; matricula: string } | null;
  report?: { id: string; number: string; status: ExpenseStatus } | null;
}

export interface ExpenseReport {
  id: string;
  employeeId: string;
  number: string;
  title: string;
  status: ExpenseStatus;
  total: string | number;
  approvedTotal: string | number;
  reimbursableTotal: string | number;
  submittedAt: string;
  approvedAt: string | null;
  approverName: string | null;
  rejectionReason: string | null;
  reimbursementMethod: ReimbursementMethod | null;
  reimbursedAt: string | null;
  payrollId: string | null;
  employee: { id: string; firstName: string; lastName: string; nif?: string | null; department?: string | null; position?: string | null };
  payroll?: { id: string; month: number; year: number; status: string } | null;
  _count?: { claims: number };
  warningsCount?: number;
  claims?: ExpenseClaim[];
  canApprove?: boolean;
  isOwn?: boolean;
}

export interface ExpenseSettings {
  mileageRate: string | number;
  perDiemEsOvernight: string | number;
  perDiemEsDay: string | number;
  perDiemAbroadOvernight: string | number;
  perDiemAbroadDay: string | number;
  maxDaysOld: number;
  requireProject: boolean;
  autoPostAccounting: boolean;
  defaultReimbursement: ReimbursementMethod;
}

export interface ExpensePolicy {
  id: string;
  category: ExpenseCategory;
  maxAmount: string | number | null;
  requiresReceipt: boolean;
  isActive: boolean;
}

export interface ExpenseContext {
  employee: { id: string; firstName: string; lastName: string; department: string | null } | null;
  canApprove: boolean;
  settings: ExpenseSettings;
  legal: { mileageRate: number; perDiem: Record<PerDiemType, number> };
}

export interface ExpenseAnalytics {
  range: { from: string; to: string };
  totals: {
    approved: number; claims: number; vatRecoverable: number; companyCard: number; employees: number;
    withWarnings: number; pendingApproval: number; pendingApprovalCount: number;
    pendingReimbursement: number; pendingReimbursementCount: number;
  };
  byCategory: { category: ExpenseCategory; label: string; amount: number; count: number }[];
  byEmployee: { employeeId: string; label: string; amount: number; count: number }[];
  byProject: { projectId: string; label: string; amount: number; count: number; color?: string | null }[];
  byVehicle: { vehicleId: string; label: string; amount: number; count: number }[];
  byMonth: { month: string; amount: number }[];
  warnings: { code: string; count: number }[];
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  TRANSPORT: "Transporte",
  FUEL: "Combustible",
  TOLLS_PARKING: "Peajes y parking",
  MEALS: "Manutención",
  ACCOMMODATION: "Alojamiento",
  PER_DIEM: "Dietas",
  MILEAGE: "Kilometraje",
  REPRESENTATION: "Representación",
  SUPPLIES: "Material",
  TRAINING: "Formación",
  OTHER: "Otros",
};

export const CATEGORY_HINTS: Record<ExpenseCategory, string> = {
  TRANSPORT: "Taxi, tren, avión, transporte público",
  FUEL: "Repostaje de vehículo de empresa",
  TOLLS_PARKING: "Autopistas y aparcamientos",
  MEALS: "Comidas del empleado durante el desplazamiento",
  ACCOMMODATION: "Hotel o alojamiento justificado",
  PER_DIEM: "Importe fijo por día de desplazamiento",
  MILEAGE: "Vehículo propio: km × tarifa",
  REPRESENTATION: "Comidas o atenciones con clientes",
  SUPPLIES: "Material de oficina o pequeño equipo",
  TRAINING: "Cursos, libros, inscripciones",
  OTHER: "Cualquier otro gasto",
};

export const STATUS_LABELS: Record<ExpenseStatus, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  REIMBURSED: "Reembolsado",
};

export const STATUS_VARIANT: Record<ExpenseStatus, "secondary" | "warning" | "info" | "destructive" | "success"> = {
  DRAFT: "secondary",
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "destructive",
  REIMBURSED: "success",
};

export const PER_DIEM_LABELS: Record<PerDiemType, string> = {
  ES_OVERNIGHT: "España, con pernocta",
  ES_DAY: "España, sin pernocta",
  ABROAD_OVERNIGHT: "Extranjero, con pernocta",
  ABROAD_DAY: "Extranjero, sin pernocta",
};

export const PER_DIEM_SETTING_KEY: Record<PerDiemType, keyof ExpenseSettings> = {
  ES_OVERNIGHT: "perDiemEsOvernight",
  ES_DAY: "perDiemEsDay",
  ABROAD_OVERNIGHT: "perDiemAbroadOvernight",
  ABROAD_DAY: "perDiemAbroadDay",
};

export const METHOD_LABELS: Record<ReimbursementMethod, string> = {
  PAYROLL: "En la nómina",
  TRANSFER: "Transferencia",
  CASH: "Efectivo",
};

export const WARNING_LABELS: Record<string, string> = {
  OVER_LIMIT: "Supera el máximo",
  MISSING_RECEIPT: "Sin justificante",
  DUPLICATE: "Posible duplicado",
  FUTURE_DATE: "Fecha futura",
  TOO_OLD: "Gasto antiguo",
  NO_PROJECT: "Sin proyecto",
  VAT_WITHOUT_NIF: "IVA sin NIF",
};

export const RECEIPTLESS_CATEGORIES: ExpenseCategory[] = ["MILEAGE", "PER_DIEM"];

function errorMessage(err: any, fallback: string) {
  const msg = err?.response?.data?.message;
  return Array.isArray(msg) ? msg.join(", ") : msg || fallback;
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["expense-claims"] });
  qc.invalidateQueries({ queryKey: ["expense-reports"] });
  qc.invalidateQueries({ queryKey: ["expense-analytics"] });
  qc.invalidateQueries({ queryKey: ["payroll"] });
  qc.invalidateQueries({ queryKey: ["payrolls"] });
  qc.invalidateQueries({ queryKey: ["payroll-stats"] });
  qc.invalidateQueries({ queryKey: ["projects", "profitability"] });
}

export function useExpenseContext() {
  return useQuery<ExpenseContext>({
    queryKey: ["expense-context"],
    queryFn: () => api.get("/expense-claims/me").then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useExpenseClaims(params?: Record<string, string | undefined>) {
  return useQuery<ExpenseClaim[]>({
    queryKey: ["expense-claims", params],
    queryFn: () => api.get("/expense-claims/claims", { params }).then((r) => r.data),
    staleTime: 15_000,
  });
}

export function useCreateExpenseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/expense-claims/claims", data).then((r) => r.data as ExpenseClaim),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Gasto guardado");
    },
    onError: (err) => toast.error(errorMessage(err, "No se pudo guardar el gasto")),
  });
}

export function useUpdateExpenseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.patch(`/expense-claims/claims/${id}`, data).then((r) => r.data as ExpenseClaim),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Gasto actualizado");
    },
    onError: (err) => toast.error(errorMessage(err, "No se pudo actualizar el gasto")),
  });
}

export function useDeleteExpenseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expense-claims/claims/${id}`).then((r) => r.data),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Gasto eliminado");
    },
    onError: (err) => toast.error(errorMessage(err, "No se pudo eliminar el gasto")),
  });
}

export function useExpenseReports(params?: Record<string, string | undefined>, enabled = true) {
  return useQuery<ExpenseReport[]>({
    queryKey: ["expense-reports", params],
    queryFn: () => api.get("/expense-claims/reports", { params }).then((r) => r.data),
    staleTime: 15_000,
    enabled,
  });
}

export function useExpenseReport(id: string | null) {
  return useQuery<ExpenseReport>({
    queryKey: ["expense-reports", "detail", id],
    queryFn: () => api.get(`/expense-claims/reports/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateExpenseReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { claimIds: string[]; title?: string }) =>
      api.post("/expense-claims/reports", data).then((r) => r.data as ExpenseReport),
    onSuccess: (r) => {
      invalidateAll(qc);
      toast.success(`Nota ${r.number} enviada a aprobación`);
    },
    onError: (err) => toast.error(errorMessage(err, "No se pudo enviar la nota de gasto")),
  });
}

function useReportAction<T extends Record<string, unknown>>(action: string, success: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & T) =>
      api.post(`/expense-claims/reports/${id}/${action}`, body).then((r) => r.data),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(success);
    },
    onError: (err) => toast.error(errorMessage(err, "No se pudo completar la acción")),
  });
}

export const useWithdrawExpenseReport = () => useReportAction("withdraw", "Nota retirada; los gastos vuelven a borrador");
export const useApproveExpenseReport = () =>
  useReportAction<{ reimbursementMethod: ReimbursementMethod; rejectedClaims: { id: string; reason: string }[] }>(
    "approve", "Nota de gasto aprobada",
  );
export const useRejectExpenseReport = () => useReportAction<{ reason: string }>("reject", "Nota de gasto rechazada");
export const useReopenExpenseReport = () => useReportAction("reopen", "Nota reabierta para revisión");
export const useReimburseExpenseReport = () =>
  useReportAction<{ method: "TRANSFER" | "CASH"; date?: string }>("reimburse", "Reembolso registrado");

export function useExpenseAnalytics(params?: { from?: string; to?: string }) {
  return useQuery<ExpenseAnalytics>({
    queryKey: ["expense-analytics", params],
    queryFn: () => api.get("/expense-claims/analytics", { params }).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useExpensePolicies() {
  return useQuery<ExpensePolicy[]>({
    queryKey: ["expense-policies"],
    queryFn: () => api.get("/expense-claims/policies").then((r) => r.data),
  });
}

export function useSaveExpenseConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { settings: Partial<ExpenseSettings>; policies: Partial<ExpensePolicy>[] }) => {
      await api.patch("/expense-claims/settings", data.settings);
      await api.put("/expense-claims/policies", { policies: data.policies });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense-context"] });
      qc.invalidateQueries({ queryKey: ["expense-policies"] });
      toast.success("Configuración guardada");
    },
    onError: (err) => toast.error(errorMessage(err, "No se pudo guardar la configuración")),
  });
}

export function warningsOf(claim: Pick<ExpenseClaim, "policyWarnings">) {
  return (claim.policyWarnings ?? []).filter((w) => w.severity === "warning");
}
