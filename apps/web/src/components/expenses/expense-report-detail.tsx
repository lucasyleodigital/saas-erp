"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { AlertTriangle, Download, ExternalLink, Info, Loader2, Paperclip, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { downloadExpenseReportPdf } from "@/lib/pdf/download-pdf";
import {
  CATEGORY_LABELS,
  METHOD_LABELS,
  PER_DIEM_LABELS,
  STATUS_LABELS,
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

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function claimDetail(c: ExpenseClaim) {
  if (c.category === "MILEAGE") {
    const route = [c.origin, c.destination].filter(Boolean).join(" → ");
    return `${route ? route + " · " : ""}${Number(c.distanceKm)} km`;
  }
  if (c.category === "PER_DIEM" && c.perDiemType) {
    return `${PER_DIEM_LABELS[c.perDiemType]} · ${Number(c.perDiemDays)} día(s)`;
  }
  return c.merchant || c.description || "—";
}

export function WarningIcons({ claim }: { claim: ExpenseClaim }) {
  const list = claim.policyWarnings ?? [];
  if (!list.length) return null;
  const hasWarning = list.some((w) => w.severity === "warning");
  const Icon = hasWarning ? AlertTriangle : Info;
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs", hasWarning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
      title={list.map((w) => w.message).join("\n")}
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

  async function handleApprove() {
    if (!report) return;
    await approve.mutateAsync({
      id: report.id,
      reimbursementMethod: effectiveMethod,
      rejectedClaims: Object.entries(rejectedLines).map(([id, reason]) => ({ id, reason: reason || "Rechazado por administración" })),
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
      await downloadExpenseReportPdf(report.id);
    } catch {
      toast.error("No se pudo generar el PDF");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={!!reportId} onOpenChange={(v) => { if (!v) { onClose(); setRejectedLines({}); setRejectMode(false); setMethod(null); } }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        {isLoading || !report ? (
          <div className="flex justify-center py-16">
            <DialogTitle className="sr-only">Cargando nota de gasto</DialogTitle>
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
                    {" · "}enviada el {formatDate(report.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[report.status]}>{STATUS_LABELS[report.status]}</Badge>
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    <span className="ml-1.5">PDF</span>
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {report.status === "REJECTED" && report.rejectionReason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                Rechazada: {report.rejectionReason}
              </div>
            )}
            {report.approvedAt && (
              <p className="text-sm text-muted-foreground">
                Aprobada el {formatDate(report.approvedAt)}{report.approverName ? ` por ${report.approverName}` : ""}
                {report.reimbursementMethod ? ` · Reembolso: ${METHOD_LABELS[report.reimbursementMethod].toLowerCase()}` : ""}
                {report.payroll ? ` (nómina de ${MONTHS[report.payroll.month - 1]} ${report.payroll.year})` : ""}
                {report.reimbursedAt ? ` · Pagado el ${formatDate(report.reimbursedAt)}` : ""}
              </p>
            )}

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    {reviewing && <th className="px-3 py-2 text-left font-medium w-8" title="Rechazar línea">Rech.</th>}
                    <th className="px-3 py-2 text-left font-medium">Fecha</th>
                    <th className="px-3 py-2 text-left font-medium">Concepto</th>
                    <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Proyecto</th>
                    <th className="px-3 py-2 text-right font-medium">Importe</th>
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
                              aria-label="Rechazar esta línea"
                              checked={c.id in rejectedLines}
                              onChange={() => toggleLine(c.id)}
                              className="h-4 w-4 accent-destructive"
                            />
                          </td>
                        )}
                        <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatDate(c.date)}</td>
                        <td className="px-3 py-2.5 min-w-[180px]">
                          <div className="font-medium">{CATEGORY_LABELS[c.category]}</div>
                          <div className="text-xs text-muted-foreground">{claimDetail(c)}</div>
                          {c.description && c.merchant && <div className="text-xs text-muted-foreground">{c.description}</div>}
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {c.paidWithCompanyCard && <Badge variant="secondary" className="text-[10px]">Tarjeta empresa</Badge>}
                            {c.vatDeductible && <Badge variant="info" className="text-[10px]">IVA deducible {Number(c.vatRate)}%</Badge>}
                            {Number(c.taxableAmount) > 0 && (
                              <Badge variant="warning" className="text-[10px]">Tributa {formatCurrency(Number(c.taxableAmount))}</Badge>
                            )}
                            {c.vehicle && <Badge variant="outline" className="text-[10px]">{c.vehicle.matricula}</Badge>}
                          </div>
                          {(c.policyWarnings ?? []).length > 0 && (
                            <ul className="mt-1.5 space-y-0.5">
                              {(c.policyWarnings ?? []).map((w) => (
                                <li
                                  key={w.code}
                                  className={cn("flex items-start gap-1 text-xs", w.severity === "warning" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
                                >
                                  {w.severity === "warning" ? <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> : <Info className="h-3 w-3 mt-0.5 shrink-0" />}
                                  {w.message}
                                </li>
                              ))}
                            </ul>
                          )}
                          {c.status === "REJECTED" && c.rejectionReason && (
                            <p className="text-xs text-destructive mt-1">Rechazado: {c.rejectionReason}</p>
                          )}
                          {reviewing && c.id in rejectedLines && (
                            <Input
                              className="mt-1.5 h-8 text-xs"
                              placeholder="Motivo del rechazo de esta línea"
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
                          {formatCurrency(Number(c.amount))}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {c.receiptUrl ? (
                            <a href={c.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline" title="Ver justificante">
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
                <p className="text-xs text-muted-foreground">Total nota</p>
                <p className="font-semibold tabular-nums">{formatCurrency(Number(report.total))}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{reviewing ? "A aprobar" : "Aprobado"}</p>
                <p className="font-semibold tabular-nums">{formatCurrency(reviewing ? previewTotal : Number(report.approvedTotal))}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">A reembolsar</p>
                <p className="font-semibold tabular-nums">{formatCurrency(reviewing ? previewReimbursable : Number(report.reimbursableTotal))}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">IVA deducible</p>
                <p className="font-semibold tabular-nums">{formatCurrency(vatDeductible)}</p>
              </div>
            </div>

            {reviewing && !rejectMode && (
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="approve-method">Cómo se reembolsa</Label>
                  <Select value={effectiveMethod} onValueChange={(v) => setMethod(v as ReimbursementMethod)}>
                    <SelectTrigger id="approve-method"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(METHOD_LABELS) as ReimbursementMethod[]).map((m) => (
                        <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setRejectMode(true)}>Rechazar nota</Button>
                  <Button onClick={handleApprove} disabled={approve.isPending || approvedPreview.length === 0}>
                    {approve.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    {Object.keys(rejectedLines).length ? `Aprobar ${approvedPreview.length} de ${claims.length}` : "Aprobar"}
                  </Button>
                </div>
              </div>
            )}

            {reviewing && rejectMode && (
              <div className="space-y-2 rounded-lg border border-destructive/30 p-3">
                <Label htmlFor="reject-reason">Motivo del rechazo</Label>
                <Textarea id="reject-reason" rows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Falta el justificante del hotel..." />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setRejectMode(false)}>Cancelar</Button>
                  <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || reject.isPending}>
                    {reject.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    Rechazar nota completa
                  </Button>
                </div>
              </div>
            )}

            {canApprove && report.status === "APPROVED" && (
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
                {report.reimbursementMethod === "PAYROLL" && (
                  <p className="text-sm text-muted-foreground">
                    {report.payroll
                      ? `Incluida en la nómina de ${MONTHS[report.payroll.month - 1]} ${report.payroll.year}. Se marcará como reembolsada al pagar la nómina.`
                      : "Se incluirá automáticamente al generar la próxima nómina del empleado."}
                    {" "}También puedes pagarla ahora por otro medio:
                  </p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pay-method">Medio de pago</Label>
                    <Select value={payMethod} onValueChange={(v) => setPayMethod(v as "TRANSFER" | "CASH")}>
                      <SelectTrigger id="pay-method" className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                        <SelectItem value="CASH">Efectivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pay-date">Fecha de pago</Label>
                    <Input id="pay-date" type="date" className="w-40" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2 sm:ml-auto">
                    <Button variant="ghost" onClick={() => reopen.mutate({ id: report.id })} disabled={reopen.isPending}>
                      <Undo2 className="h-4 w-4 mr-1.5" /> Reabrir
                    </Button>
                    <Button onClick={() => reimburse.mutate({ id: report.id, method: payMethod, date: payDate })} disabled={reimburse.isPending}>
                      {reimburse.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                      Marcar reembolsada
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {report.isOwn && isPending && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={async () => { await withdraw.mutateAsync({ id: report.id }); onClose(); }} disabled={withdraw.isPending}>
                  Retirar nota y volver a editar
                </Button>
              </div>
            )}

            {claims.some((c) => c.receiptUrl) && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" /> Los justificantes se abren en una pestaña nueva.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
