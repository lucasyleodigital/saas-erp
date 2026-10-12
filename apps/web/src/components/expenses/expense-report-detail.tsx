"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AlertTriangle, Download, ExternalLink, Info, Loader2, Paperclip, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { downloadExpenseReportPdf } from "@/lib/pdf/download-pdf";
import {
  REIMBURSEMENT_METHODS,
  STATUS_VARIANT,
  useApproveExpenseReport,
  useExpenseReport,
  useReimburseExpenseReport,
  useRejectExpenseReport,
  useReopenExpenseReport,
  useWithdrawExpenseReport,
  type ExpenseClaim,
  type ExpenseSettings,
  type ReimbursementMethod,
} from "@/hooks/use-expense-claims";
import { useExpenseFormat } from "./use-expense-format";
import { usePdfLabels } from "./use-pdf-labels";

export function WarningIcons({ claim }: { claim: ExpenseClaim }) {
  const { warningText } = useExpenseFormat();
  const list = claim.policyWarnings ?? [];
  if (!list.length) return null;
  const hasWarning = list.some((w) => w.severity === "warning");
  const Icon = hasWarning ? AlertTriangle : Info;
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs", hasWarning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
      title={list.map(warningText).join("\n")}
    >
      <Icon className="h-3.5 w-3.5" />
      {list.length}
    </span>
  );
}

export function ExpenseReportDetail({
  reportId,
  onClose,
  settings,
}: {
  reportId: string | null;
  onClose: () => void;
  settings: ExpenseSettings;
}) {
  const { t, money, date, monthYear, claimDetail, warningText } = useExpenseFormat();
  const pdfLabels = usePdfLabels();
  const { data: report, isLoading } = useExpenseReport(reportId);
  const approve = useApproveExpenseReport();
  const reject = useRejectExpenseReport();
  const reopen = useReopenExpenseReport();
  const reimburse = useReimburseExpenseReport();
  const withdraw = useWithdrawExpenseReport();

  const [method, setMethod] = useState<ReimbursementMethod | null>(null);
  const [rejectedLines, setRejectedLines] = useState<Record<string, string>>({});
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [payMethod, setPayMethod] = useState<"TRANSFER" | "CASH">("TRANSFER");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [downloading, setDownloading] = useState(false);

  const claims = report?.claims ?? [];
  const isPending = report?.status === "PENDING";
  const canApprove = !!report?.canApprove;
  const reviewing = canApprove && isPending;
  const effectiveMethod = method ?? settings.defaultReimbursement;

  const approvedPreview = claims.filter((c) => !(c.id in rejectedLines));
  const previewTotal = approvedPreview.reduce((s, c) => s + Number(c.amount), 0);
  const previewReimbursable = approvedPreview.filter((c) => !c.paidWithCompanyCard).reduce((s, c) => s + Number(c.amount), 0);
  const vatDeductible = claims
    .filter((c) => c.vatDeductible && Number(c.vatRate) > 0 && c.status !== "REJECTED")
    .reduce((s, c) => s + Number(c.amount) - Number(c.amount) / (1 + Number(c.vatRate) / 100), 0);

  function toggleLine(id: string) {
    setRejectedLines((cur) => {
      const next = { ...cur };
      if (id in next) delete next[id];
      else next[id] = "";
      return next;
    });
  }

  function close() {
    onClose();
    setRejectedLines({});
    setRejectMode(false);
    setMethod(null);
  }

  async function handleApprove() {
    if (!report) return;
    await approve.mutateAsync({
      id: report.id,
      reimbursementMethod: effectiveMethod,
      rejectedClaims: Object.entries(rejectedLines).map(([id, reason]) => ({ id, reason: reason || t("report.defaultLineReason") })),
    });
    setRejectedLines({});
  }

  async function handleReject() {
    if (!report || !rejectReason.trim()) return;
    await reject.mutateAsync({ id: report.id, reason: rejectReason.trim() });
    setRejectMode(false);
    setRejectReason("");
  }

  async function handleDownload() {
    if (!report) return;
    setDownloading(true);
    try {
      await downloadExpenseReportPdf(report.id, pdfLabels);
    } catch {
      toast.error(t("report.pdfError"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={!!reportId} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        {isLoading || !report ? (
          <div className="flex justify-center py-16">
            <DialogTitle className="sr-only">{t("report.loading")}</DialogTitle>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-muted-foreground">{report.number}</p>
                  <DialogTitle className="text-lg">{report.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {report.employee.firstName} {report.employee.lastName}
                    {report.employee.department ? ` · ${report.employee.department}` : ""}
                    {" · "}{t("report.sentOn", { date: date(report.submittedAt) })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[report.status]}>{t(`status.${report.status}`)}</Badge>
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    <span className="ml-1.5">PDF</span>
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {report.status === "REJECTED" && report.rejectionReason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {t("report.rejectedReason", { reason: report.rejectionReason })}
              </div>
            )}
            {report.approvedAt && (
              <p className="text-sm text-muted-foreground">
                {t("report.approvedOn", { date: date(report.approvedAt) })}
                {report.approverName ? t("report.by", { name: report.approverName }) : ""}
                {report.reimbursementMethod ? t("report.reimbursement", { method: t(`methods.${report.reimbursementMethod}`).toLowerCase() }) : ""}
                {report.payroll ? t("report.payrollOf", { period: monthYear(report.payroll.month, report.payroll.year) }) : ""}
                {report.reimbursedAt ? t("report.paidOn", { date: date(report.reimbursedAt) }) : ""}
              </p>
            )}

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    {reviewing && <th className="px-3 py-2 text-left font-medium w-8" title={t("report.cols.rejectTitle")}>{t("report.cols.reject")}</th>}
                    <th className="px-3 py-2 text-left font-medium">{t("report.cols.date")}</th>
                    <th className="px-3 py-2 text-left font-medium">{t("report.cols.concept")}</th>
                    <th className="px-3 py-2 text-left font-medium hidden md:table-cell">{t("report.cols.project")}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("report.cols.amount")}</th>
                    <th className="px-3 py-2 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {claims.map((c) => {
                    const lineRejected = c.id in rejectedLines || c.status === "REJECTED";
                    return (
                      <tr key={c.id} className={cn("border-t align-top", lineRejected && "bg-destructive/5")}>
                        {reviewing && (
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              aria-label={t("report.rejectLine")}
                              checked={c.id in rejectedLines}
                              onChange={() => toggleLine(c.id)}
                              className="h-4 w-4 accent-destructive"
                            />
                          </td>
                        )}
                        <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{date(c.date)}</td>
                        <td className="px-3 py-2.5 min-w-[180px]">
                          <div className="font-medium">{t(`categories.${c.category}`)}</div>
                          <div className="text-xs text-muted-foreground">{claimDetail(c)}</div>
                          {c.description && c.merchant && <div className="text-xs text-muted-foreground">{c.description}</div>}
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {c.paidWithCompanyCard && (
                              <Badge variant="secondary" className="text-[10px]">
                                {t("report.companyCard")}{c.card ? ` ·${c.card.last4}` : ""}
                              </Badge>
                            )}
                            {c.vatDeductible && <Badge variant="info" className="text-[10px]">{t("report.vatDeductible", { rate: Number(c.vatRate) })}</Badge>}
                            {Number(c.taxableAmount) > 0 && (
                              <Badge variant="warning" className="text-[10px]">{t("report.taxable", { amount: money(c.taxableAmount) })}</Badge>
                            )}
                            {c.vehicle && <Badge variant="outline" className="text-[10px]">{c.vehicle.matricula}</Badge>}
                            {c.source !== "MANUAL" && <Badge variant="outline" className="text-[10px]">{t(`source.${c.source}`)}</Badge>}
                          </div>
                          {(c.policyWarnings ?? []).length > 0 && (
                            <ul className="mt-1.5 space-y-0.5">
                              {(c.policyWarnings ?? []).map((w) => (
                                <li
                                  key={w.code}
                                  className={cn("flex items-start gap-1 text-xs", w.severity === "warning" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
                                >
                                  {w.severity === "warning" ? <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> : <Info className="h-3 w-3 mt-0.5 shrink-0" />}
                                  {warningText(w)}
                                </li>
                              ))}
                            </ul>
                          )}
                          {c.status === "REJECTED" && c.rejectionReason && (
                            <p className="text-xs text-destructive mt-1">{t("report.lineRejected", { reason: c.rejectionReason })}</p>
                          )}
                          {reviewing && c.id in rejectedLines && (
                            <Input
                              className="mt-1.5 h-8 text-xs"
                              placeholder={t("report.lineRejectPlaceholder")}
                              value={rejectedLines[c.id]}
                              onChange={(e) => setRejectedLines((cur) => ({ ...cur, [c.id]: e.target.value }))}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-xs">
                          {c.project ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ background: c.project.color }} />
                              {c.project.name}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className={cn("px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap", lineRejected && "line-through text-muted-foreground")}>
                          {money(c.amount)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {c.receiptUrl ? (
                            <a href={c.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline" title={t("report.viewReceipt")}>
                              <Paperclip className="h-4 w-4" />
                            </a>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t("report.total")}</p>
                <p className="font-semibold tabular-nums">{money(report.total)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{reviewing ? t("report.toApprove") : t("report.approved")}</p>
                <p className="font-semibold tabular-nums">{money(reviewing ? previewTotal : report.approvedTotal)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t("report.toReimburse")}</p>
                <p className="font-semibold tabular-nums">{money(reviewing ? previewReimbursable : report.reimbursableTotal)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t("report.vatDeductibleTotal")}</p>
                <p className="font-semibold tabular-nums">{money(vatDeductible)}</p>
              </div>
            </div>

            {reviewing && !rejectMode && (
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="approve-method">{t("report.howReimbursed")}</Label>
                  <Select value={effectiveMethod} onValueChange={(v) => setMethod(v as ReimbursementMethod)}>
                    <SelectTrigger id="approve-method"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REIMBURSEMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{t(`methods.${m}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setRejectMode(true)}>{t("report.rejectReport")}</Button>
                  <Button onClick={handleApprove} disabled={approve.isPending || approvedPreview.length === 0}>
                    {approve.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    {Object.keys(rejectedLines).length
                      ? t("report.approvePartial", { approved: approvedPreview.length, total: claims.length })
                      : t("report.approve")}
                  </Button>
                </div>
              </div>
            )}

            {reviewing && rejectMode && (
              <div className="space-y-2 rounded-lg border border-destructive/30 p-3">
                <Label htmlFor="reject-reason">{t("report.rejectReason")}</Label>
                <Textarea id="reject-reason" rows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t("report.rejectPlaceholder")} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setRejectMode(false)}>{t("report.cancel")}</Button>
                  <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || reject.isPending}>
                    {reject.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    {t("report.rejectAll")}
                  </Button>
                </div>
              </div>
            )}

            {canApprove && report.status === "APPROVED" && (
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
                {report.reimbursementMethod === "PAYROLL" && (
                  <p className="text-sm text-muted-foreground">
                    {report.payroll
                      ? t("report.payrollIncluded", { period: monthYear(report.payroll.month, report.payroll.year) })
                      : t("report.payrollNext")}
                    {" "}{t("report.payOther")}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pay-method">{t("report.payMethod")}</Label>
                    <Select value={payMethod} onValueChange={(v) => setPayMethod(v as "TRANSFER" | "CASH")}>
                      <SelectTrigger id="pay-method" className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRANSFER">{t("methods.TRANSFER")}</SelectItem>
                        <SelectItem value="CASH">{t("methods.CASH")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pay-date">{t("report.payDate")}</Label>
                    <Input id="pay-date" type="date" className="w-40" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2 sm:ml-auto">
                    <Button variant="ghost" onClick={() => reopen.mutate({ id: report.id })} disabled={reopen.isPending}>
                      <Undo2 className="h-4 w-4 mr-1.5" /> {t("report.reopen")}
                    </Button>
                    <Button onClick={() => reimburse.mutate({ id: report.id, method: payMethod, date: payDate })} disabled={reimburse.isPending}>
                      {reimburse.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                      {t("report.markReimbursed")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {report.isOwn && isPending && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={async () => { await withdraw.mutateAsync({ id: report.id }); onClose(); }} disabled={withdraw.isPending}>
                  {t("report.withdraw")}
                </Button>
              </div>
            )}

            {claims.some((c) => c.receiptUrl) && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" /> {t("report.receiptsHint")}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
