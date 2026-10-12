"use client";

import { useLocale, useTranslations } from "next-intl";
import { EXPENSE_CATEGORIES, PER_DIEM_TYPES, REIMBURSEMENT_METHODS } from "@/hooks/use-expense-claims";
import type { ExpenseReportPdfLabels } from "@/lib/pdf/expense-report-pdf";

export function usePdfLabels(): ExpenseReportPdfLabels {
  const t = useTranslations("expenses");
  const locale = useLocale();
  const map = <K extends string>(keys: readonly K[], prefix: string) =>
    Object.fromEntries(keys.map((k) => [k, t.raw(`${prefix}.${k}`) as string])) as Record<K, string>;

  return {
    locale,
    title: t.raw("pdf.title") as string,
    status: map(["DRAFT", "PENDING", "APPROVED", "REJECTED", "REIMBURSED"] as const, "pdf.status"),
    categories: map(EXPENSE_CATEGORIES, "categories"),
    perDiem: map(PER_DIEM_TYPES, "perDiem"),
    methods: map(REIMBURSEMENT_METHODS, "methods"),
    employee: t.raw("pdf.employee") as string,
    report: t.raw("pdf.report") as string,
    submitted: t.raw("pdf.submitted") as string,
    approved: t.raw("pdf.approved") as string,
    approvedBy: t.raw("pdf.approvedBy") as string,
    reimbursement: t.raw("pdf.reimbursement") as string,
    date: t.raw("pdf.date") as string,
    category: t.raw("pdf.category") as string,
    detail: t.raw("pdf.detail") as string,
    vat: t.raw("pdf.vat") as string,
    amount: t.raw("pdf.amount") as string,
    project: t.raw("pdf.project") as string,
    companyCardPaid: t.raw("pdf.companyCardPaid") as string,
    rejected: t.raw("pdf.rejected") as string,
    total: t.raw("pdf.total") as string,
    lessCard: t.raw("pdf.lessCard") as string,
    toReimburse: t.raw("pdf.toReimburse") as string,
    taxableNote: t.raw("pdf.taxableNote") as string,
    employeeSignature: t.raw("pdf.employeeSignature") as string,
    approvedBySignature: t.raw("pdf.approvedBySignature") as string,
    footer: t.raw("pdf.footer") as string,
    days: t.raw("pdf.days") as string,
  };
}
