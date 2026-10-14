"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type ExpenseCategory =
  | "TRANSPORT" | "FUEL" | "TOLLS_PARKING" | "MEALS" | "ACCOMMODATION" | "PER_DIEM"
  | "MILEAGE" | "REPRESENTATION" | "SUPPLIES" | "TRAINING" | "OTHER";
export type ExpenseStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "REIMBURSED";
export type ReimbursementMethod = "PAYROLL" | "TRANSFER" | "CASH";
export type PerDiemType = "ES_OVERNIGHT" | "ES_DAY" | "ABROAD_OVERNIGHT" | "ABROAD_DAY";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "TRANSPORT", "FUEL", "TOLLS_PARKING", "MEALS", "ACCOMMODATION", "PER_DIEM",
  "MILEAGE", "REPRESENTATION", "SUPPLIES", "TRAINING", "OTHER",
];
export const PER_DIEM_TYPES: PerDiemType[] = ["ES_OVERNIGHT", "ES_DAY", "ABROAD_OVERNIGHT", "ABROAD_DAY"];
export const REIMBURSEMENT_METHODS: ReimbursementMethod[] = ["PAYROLL", "TRANSFER", "CASH"];
export const RECEIPTLESS_CATEGORIES: ExpenseCategory[] = ["MILEAGE", "PER_DIEM"];

export interface PolicyWarning {
  code: string;
  message: string;
  severity: "warning" | "info";
  params?: Record<string, string | number>;
}

export interface CompanyCard {
  id: string;
  name: string;
  last4: string;
  employeeId: string | null;
  bankAccountId: string | null;
  dedicatedAccount: boolean;
  isActive: boolean;
  employee?: { id: string; firstName: string; lastName: string } | null;
  bankAccount?: { id: string; name: string } | null;
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
  cardId: string | null;
  bankTransactionId: string | null;
  source: "MANUAL" | "EMAIL" | "CARD";
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
  card?: { id: string; name: string; last4: string } | null;
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
  plan: { hasExpenseClaims: boolean; hasExpenseAdvanced: boolean; hasFleet: boolean };
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

export type ChargeStatus = "JUSTIFIED" | "PENDING_RECEIPT" | "MISSING";

export interface CardCharge {
  id: string;
  date: string;
  amount: number;
  description: string;
  bankAccount: string;
  card: { id: string; name: string; last4: string; employee: { id: string; firstName: string; lastName: string } | null } | null;
  claim: {
    id: string; status: ExpenseStatus; category: ExpenseCategory; merchant: string | null; receiptUrl: string | null;
    amount: string | number; employee: { firstName: string; lastName: string };
  } | null;
  status: ChargeStatus;
}

export interface CardReconciliation {
  range: { from: string; to: string };
  cards: number;
  totals: {
    charges: number; amount: number; justified: number; missing: number; missingAmount: number;
    pendingReceipt: number; unmatchedClaims: number;
  };
  charges: CardCharge[];
  unmatchedClaims: ExpenseClaim[];
}

export const PER_DIEM_SETTING_KEY: Record<PerDiemType, keyof ExpenseSettings> = {
  ES_OVERNIGHT: "perDiemEsOvernight",
  ES_DAY: "perDiemEsDay",
  ABROAD_OVERNIGHT: "perDiemAbroadOvernight",
  ABROAD_DAY: "perDiemAbroadDay",
};

export const STATUS_VARIANT: Record<ExpenseStatus, "secondary" | "warning" | "info" | "destructive" | "success"> = {
  DRAFT: "secondary",
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "destructive",
  REIMBURSED: "success",
};

function errorMessage(err: any, fallback: string) {
  const msg = err?.response?.data?.message;
  return Array.isArray(msg) ? msg.join(", ") : msg || fallback;
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["expense-claims"] });
  qc.invalidateQueries({ queryKey: ["expense-reports"] });
  qc.invalidateQueries({ queryKey: ["expense-analytics"] });
  qc.invalidateQueries({ queryKey: ["expense-cards"] });
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
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/expense-claims/claims", data).then((r) => r.data as ExpenseClaim),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(t("saved"));
    },
    onError: (err) => toast.error(errorMessage(err, t("saveError"))),
  });
}

export function useUpdateExpenseClaim() {
  const qc = useQueryClient();
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.patch(`/expense-claims/claims/${id}`, data).then((r) => r.data as ExpenseClaim),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(t("updated"));
    },
    onError: (err) => toast.error(errorMessage(err, t("updateError"))),
  });
}

export function useDeleteExpenseClaim() {
  const qc = useQueryClient();
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expense-claims/claims/${id}`).then((r) => r.data),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(t("deleted"));
    },
    onError: (err) => toast.error(errorMessage(err, t("deleteError"))),
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
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: (data: { claimIds: string[]; title?: string }) =>
      api.post("/expense-claims/reports", data).then((r) => r.data as ExpenseReport),
    onSuccess: (r) => {
      invalidateAll(qc);
      toast.success(t("reportSent", { number: r.number }));
    },
    onError: (err) => toast.error(errorMessage(err, t("reportError"))),
  });
}

type ToastKey = "withdrawn" | "approved" | "rejected" | "reopened" | "reimbursed";

function useReportAction<T extends Record<string, unknown>>(action: string, success: ToastKey) {
  const qc = useQueryClient();
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & T) =>
      api.post(`/expense-claims/reports/${id}/${action}`, body).then((r) => r.data),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(t(success));
    },
    onError: (err) => toast.error(errorMessage(err, t("actionError"))),
  });
}

export const useWithdrawExpenseReport = () => useReportAction("withdraw", "withdrawn");
export const useApproveExpenseReport = () =>
  useReportAction<{ reimbursementMethod: ReimbursementMethod; rejectedClaims: { id: string; reason: string }[] }>(
    "approve", "approved",
  );
export const useRejectExpenseReport = () => useReportAction<{ reason: string }>("reject", "rejected");
export const useReopenExpenseReport = () => useReportAction("reopen", "reopened");
export const useReimburseExpenseReport = () =>
  useReportAction<{ method: "TRANSFER" | "CASH"; date?: string }>("reimburse", "reimbursed");

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
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: async (data: { settings: Partial<ExpenseSettings>; policies: Partial<ExpensePolicy>[] }) => {
      await api.patch("/expense-claims/settings", data.settings);
      await api.put("/expense-claims/policies", { policies: data.policies });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense-context"] });
      qc.invalidateQueries({ queryKey: ["expense-policies"] });
      toast.success(t("configSaved"));
    },
    onError: (err) => toast.error(errorMessage(err, t("configError"))),
  });
}

// ─── Tarjetas y conciliación ─────────────────────────────────────────────────

export function useCompanyCards(enabled = true) {
  return useQuery<CompanyCard[]>({
    queryKey: ["expense-cards", "list"],
    queryFn: () => api.get("/expense-claims/cards").then((r) => r.data),
    enabled,
    staleTime: 60_000,
  });
}

export function useSaveCompanyCard() {
  const qc = useQueryClient();
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: ({ id, ...data }: { id?: string } & Record<string, unknown>) =>
      (id ? api.patch(`/expense-claims/cards/${id}`, data) : api.post("/expense-claims/cards", data)).then((r) => r.data as CompanyCard),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense-cards"] });
      toast.success(t("cardSaved"));
    },
    onError: (err) => toast.error(errorMessage(err, t("cardError"))),
  });
}

export function useDeleteCompanyCard() {
  const qc = useQueryClient();
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expense-claims/cards/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense-cards"] });
      toast.success(t("cardDeleted"));
    },
    onError: (err) => toast.error(errorMessage(err, t("actionError"))),
  });
}

export function useCardReconciliation(params: { from: string; to: string }, enabled = true) {
  return useQuery<CardReconciliation>({
    queryKey: ["expense-cards", "reconciliation", params],
    queryFn: () => api.get("/expense-claims/cards/reconciliation", { params }).then((r) => r.data),
    enabled,
  });
}

export function useAutoMatchCards() {
  const qc = useQueryClient();
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: (params: { from: string; to: string }) =>
      api.post("/expense-claims/cards/auto-match", params).then((r) => r.data as { linked: number; checked: number }),
    onSuccess: () => invalidateAll(qc),
    onError: (err) => toast.error(errorMessage(err, t("actionError"))),
  });
}

export function useRequestChargeReceipt() {
  const qc = useQueryClient();
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: (txId: string) => api.post(`/expense-claims/cards/charges/${txId}/request-receipt`).then((r) => r.data),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(t("receiptRequested"));
    },
    onError: (err) => toast.error(errorMessage(err, t("actionError"))),
  });
}

export function useUnlinkCharge() {
  const qc = useQueryClient();
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: (claimId: string) => api.delete(`/expense-claims/claims/${claimId}/link-transaction`).then((r) => r.data),
    onSuccess: () => invalidateAll(qc),
    onError: (err) => toast.error(errorMessage(err, t("actionError"))),
  });
}

// ─── Tickets por email ───────────────────────────────────────────────────────

export function useExpenseEmailAddress(enabled = true) {
  return useQuery<{ configured: boolean; address: string | null }>({
    queryKey: ["expense-email-address"],
    queryFn: () => api.get("/expense-claims/email-address").then((r) => r.data),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useRegenerateExpenseEmail() {
  const qc = useQueryClient();
  const t = useTranslations("expenses.toasts");
  return useMutation({
    mutationFn: () => api.post("/expense-claims/email-address/regenerate").then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(["expense-email-address"], data);
      toast.success(t("emailRegenerated"));
    },
    onError: (err) => toast.error(errorMessage(err, t("actionError"))),
  });
}

export function warningsOf(claim: Pick<ExpenseClaim, "policyWarnings">) {
  return (claim.policyWarnings ?? []).filter((w) => w.severity === "warning");
}
