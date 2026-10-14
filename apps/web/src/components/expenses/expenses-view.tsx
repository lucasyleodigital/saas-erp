"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocaleLink } from "@/components/ui/locale-link";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronRight, Copy, Loader2, Mail, Paperclip, Pencil, Plus, Receipt, RefreshCw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  STATUS_VARIANT,
  useCreateExpenseReport,
  useDeleteExpenseClaim,
  useExpenseClaims,
  useExpenseContext,
  useExpenseEmailAddress,
  useExpenseReports,
  useRegenerateExpenseEmail,
  warningsOf,
  type ExpenseClaim,
  type ExpenseContext,
} from "@/hooks/use-expense-claims";
import { ExpenseClaimForm, type ClaimPrefill } from "./expense-claim-form";
import { ExpenseReportDetail, WarningIcons } from "./expense-report-detail";
import { ExpenseAnalytics } from "./expense-analytics";
import { ExpenseSettingsPanel } from "./expense-settings";
import { ExpenseCards } from "./expense-cards";
import { useUser } from "@/hooks/use-user";
import { useExpenseFormat } from "./use-expense-format";
import { UpgradeRequired } from "@/components/billing/plan-gate";

type ClaimFilter = "open" | "PENDING" | "APPROVED" | "REIMBURSED" | "all";
const CLAIM_FILTERS: { value: ClaimFilter; status?: string; unreported?: boolean }[] = [
  { value: "open", unreported: true },
  { value: "PENDING", status: "PENDING" },
  { value: "APPROVED", status: "APPROVED" },
  { value: "REIMBURSED", status: "REIMBURSED" },
  { value: "all" },
];
const REPORT_FILTERS = ["PENDING", "APPROVED", "REIMBURSED", "REJECTED", "all"] as const;
const EDITABLE = ["DRAFT", "REJECTED"];

function FilterChips<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === o.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EmailAddressCard({ employeeEmail }: { employeeEmail: string | null }) {
  const { t } = useExpenseFormat();
  const { data } = useExpenseEmailAddress();
  const regenerate = useRegenerateExpenseEmail();
  const [confirm, setConfirm] = useState(false);
  if (!data?.configured || !data.address) return null;
  const address = data.address;

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(t("email.copied"));
    } catch {
      toast.info(address);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      <Mail className="h-5 w-5 text-primary shrink-0 hidden sm:block" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t("email.title")}</p>
        <p className="text-xs text-muted-foreground">{t("email.body", { email: employeeEmail ?? t("email.noEmail") })}</p>
        <p className="font-mono text-sm mt-1 break-all select-all">{address}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={copy}><Copy className="h-3.5 w-3.5 mr-1.5" /> {t("email.copy")}</Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirm(true)} title={t("email.regenerateHint")}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("email.regenerate")}
        </Button>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("email.regenerate")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t("email.regenerateHint")}</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirm(false)}>{t("claims.cancel")}</Button>
            <Button disabled={regenerate.isPending} onClick={async () => { await regenerate.mutateAsync(); setConfirm(false); }}>
              {t("email.regenerate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClaimsTab({ context, employees, onEdit, onNew }: {
  context: ExpenseContext;
  employees: { id: string; name: string }[];
  onEdit: (c: ExpenseClaim) => void;
  onNew: () => void;
}) {
  const { t, money, date, claimDetail } = useExpenseFormat();
  const [filter, setFilter] = useState<ClaimFilter>("open");
  const [employeeFilter, setEmployeeFilter] = useState<string>(context.canApprove ? "all" : "mine");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reportDialog, setReportDialog] = useState(false);
  const [reportTitle, setReportTitle] = useState("");

  const active = CLAIM_FILTERS.find((f) => f.value === filter)!;
  const params = {
    ...(active.status && { status: active.status }),
    ...(active.unreported && { unreported: "true" }),
    ...(employeeFilter === "mine" && context.canApprove && { mine: "true" }),
    ...(employeeFilter !== "all" && employeeFilter !== "mine" && { employeeId: employeeFilter }),
  };
  const { data: claims = [], isLoading } = useExpenseClaims(params);
  const del = useDeleteExpenseClaim();
  const createReport = useCreateExpenseReport();

  useEffect(() => setSelected(new Set()), [filter, employeeFilter]);

  const selectedClaims = claims.filter((c) => selected.has(c.id));
  const selectedTotal = selectedClaims.reduce((s, c) => s + Number(c.amount), 0);
  const mixedEmployees = new Set(selectedClaims.map((c) => c.employeeId)).size > 1;
  const missingAmount = selectedClaims.some((c) => Number(c.amount) <= 0);
  const openTotal = claims.filter((c) => EDITABLE.includes(c.status)).reduce((s, c) => s + Number(c.amount), 0);
  const showEmployee = context.canApprove && employeeFilter !== "mine";

  function toggle(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function sendReport() {
    await createReport.mutateAsync({ claimIds: [...selected], title: reportTitle.trim() || undefined });
    setSelected(new Set());
    setReportDialog(false);
    setReportTitle("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={CLAIM_FILTERS.map((f) => ({ value: f.value, label: t(`claims.filters.${f.value}`) }))}
        />
        {context.canApprove && (
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-full sm:w-56" aria-label={t("claims.filterByEmployee")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("claims.allEmployees")}</SelectItem>
              {context.employee && <SelectItem value="mine">{t("claims.mine")}</SelectItem>}
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {filter === "open" && claims.length > 0 && (
        <p className="text-sm text-muted-foreground">{t("claims.openSummary", { count: claims.length, total: money(openTotal) })}</p>
      )}

      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border bg-background/95 backdrop-blur px-4 py-3 shadow-sm">
          <span className="text-sm">
            {t("claims.selected", { count: selected.size, total: money(selectedTotal) })}
            {mixedEmployees && <span className="block text-xs text-destructive">{t("claims.mixed")}</span>}
            {missingAmount && <span className="block text-xs text-destructive">{t("claims.missingAmount")}</span>}
          </span>
          <Button size="sm" onClick={() => setReportDialog(true)} disabled={mixedEmployees || missingAmount}>
            <Send className="h-4 w-4 mr-1.5" /> {t("claims.createReport")}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : claims.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium">{filter === "open" ? t("claims.emptyOpenTitle") : t("claims.emptyFilterTitle")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("claims.emptyBody")}</p>
            </div>
            <Button onClick={onNew}><Plus className="h-4 w-4 mr-1.5" /> {t("newClaim")}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5" />
                <th className="px-3 py-2.5 text-left font-medium">{t("claims.cols.date")}</th>
                <th className="px-3 py-2.5 text-left font-medium">{t("claims.cols.concept")}</th>
                {showEmployee && <th className="px-3 py-2.5 text-left font-medium hidden md:table-cell">{t("claims.cols.employee")}</th>}
                <th className="px-3 py-2.5 text-left font-medium hidden lg:table-cell">{t("claims.cols.project")}</th>
                <th className="px-3 py-2.5 text-right font-medium">{t("claims.cols.amount")}</th>
                <th className="px-3 py-2.5 text-left font-medium">{t("claims.cols.status")}</th>
                <th className="px-3 py-2.5 w-24" />
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => {
                const editable = EDITABLE.includes(c.status);
                return (
                  <tr key={c.id} className={cn("border-t hover:bg-muted/30", selected.has(c.id) && "bg-primary/5")}>
                    <td className="px-3 py-2.5">
                      {editable && (
                        <input
                          type="checkbox"
                          aria-label={t("claims.select")}
                          checked={selected.has(c.id)}
                          onChange={() => toggle(c.id)}
                          className="h-4 w-4 accent-primary"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{date(c.date)}</td>
                    <td className="px-3 py-2.5 min-w-[180px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{t(`categories.${c.category}`)}</span>
                        {c.receiptUrl && (
                          <a href={c.receiptUrl} target="_blank" rel="noreferrer" title={t("claims.viewReceipt")} className="text-muted-foreground hover:text-primary">
                            <Paperclip className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <WarningIcons claim={c} />
                        {c.source !== "MANUAL" && <Badge variant="outline" className="text-[10px]">{t(`source.${c.source}`)}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[280px]">{claimDetail(c)}</div>
                      {c.status === "REJECTED" && c.rejectionReason && (
                        <div className="text-xs text-destructive">{t("claims.rejected", { reason: c.rejectionReason })}</div>
                      )}
                    </td>
                    {showEmployee && (
                      <td className="px-3 py-2.5 hidden md:table-cell whitespace-nowrap">
                        {c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : "—"}
                      </td>
                    )}
                    <td className="px-3 py-2.5 hidden lg:table-cell text-xs">
                      {c.project ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: c.project.color }} />
                          {c.project.name}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap">
                      {Number(c.amount) > 0 ? money(c.amount) : <span className="text-amber-600 dark:text-amber-400">—</span>}
                      {c.paidWithCompanyCard && (
                        <div className="text-[10px] font-normal text-muted-foreground">
                          {t("claims.companyCard")}{c.card ? ` ·${c.card.last4}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={STATUS_VARIANT[c.status]}>{t(`status.${c.status}`)}</Badge>
                      {c.report && <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{c.report.number}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      {editable && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(c)} aria-label={t("claims.edit")}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => del.mutate(c.id)}
                            disabled={del.isPending}
                            aria-label={t("claims.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("claims.sendTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("claims.sendBody", { count: selected.size, total: money(selectedTotal) })}</p>
            {selectedClaims.some((c) => warningsOf(c).length > 0) && (
              <p className="flex items-start gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {t("claims.sendWarnings")}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="report-title">{t("claims.reportTitle")}</Label>
              <Input id="report-title" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder={t("claims.reportTitlePlaceholder")} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReportDialog(false)}>{t("claims.cancel")}</Button>
            <Button onClick={sendReport} disabled={createReport.isPending}>
              {createReport.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {t("claims.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportsTab({ context, onOpen }: { context: ExpenseContext; onOpen: (id: string) => void }) {
  const { t, money, date } = useExpenseFormat();
  const [status, setStatus] = useState<string>(context.canApprove ? "PENDING" : "all");
  const { data: reports = [], isLoading } = useExpenseReports(status === "all" ? undefined : { status });

  return (
    <div className="space-y-4">
      <FilterChips value={status} onChange={setStatus} options={REPORT_FILTERS.map((f) => ({ value: f, label: t(`reports.filters.${f}`) }))} />
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="font-medium">{status === "PENDING" ? t("reports.emptyPending") : t("reports.emptyFilter")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("reports.emptyBody")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border divide-y">
          {reports.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onOpen(r.id)}
              className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{r.number}</span>
                  <span className="font-medium truncate">{r.title}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t("reports.meta", {
                    employee: `${r.employee.firstName} ${r.employee.lastName}`,
                    date: date(r.submittedAt),
                    count: r._count?.claims ?? 0,
                  })}
                  {r.payroll && r.status === "APPROVED" ? t("reports.inPayroll", { month: r.payroll.month, year: r.payroll.year }) : ""}
                </div>
              </div>
              {(r.warningsCount ?? 0) > 0 && r.status === "PENDING" && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" title={t("reports.policyWarnings")}>
                  <AlertTriangle className="h-3.5 w-3.5" /> {r.warningsCount}
                </span>
              )}
              <div className="text-right shrink-0">
                <div className="font-semibold tabular-nums">
                  {money(r.status === "PENDING" || r.status === "REJECTED" ? r.total : r.approvedTotal)}
                </div>
                <Badge variant={STATUS_VARIANT[r.status]} className="mt-0.5">{t(`status.${r.status}`)}</Badge>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExpensesView() {
  const { t } = useExpenseFormat();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: context, isLoading } = useExpenseContext();
  const included = !!context?.plan.hasExpenseClaims;
  const advanced = !!context?.plan.hasExpenseAdvanced;
  const canApprove = included && !!context?.canApprove;

  const { data: employeesData } = useQuery<{ data: { id: string; firstName: string; lastName: string; email: string | null }[] }>({
    queryKey: ["employees", { status: "ACTIVE", limit: 200 }],
    queryFn: () => api.get("/employees", { params: { status: "ACTIVE", limit: 200 } }).then((r) => r.data),
    enabled: canApprove,
  });
  const employees = useMemo(
    () => (employeesData?.data ?? []).map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`.trim() })),
    [employeesData],
  );
  const { data: me } = useUser();
  const { data: pendingReports = [] } = useExpenseReports({ status: "PENDING" }, canApprove);

  const [tab, setTab] = useState("claims");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseClaim | null>(null);
  const [prefill, setPrefill] = useState<ClaimPrefill | undefined>();
  const [openReport, setOpenReport] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("scan") !== "1") return;
    setPrefill({
      date: searchParams.get("date") ?? undefined,
      merchant: searchParams.get("merchant") ?? undefined,
      merchantNif: searchParams.get("nif") ?? undefined,
      amount: searchParams.get("amount") ?? undefined,
      vatRate: searchParams.get("vat") ?? undefined,
      description: searchParams.get("description") ?? undefined,
      receiptUrl: searchParams.get("receipt") ?? undefined,
    });
    setEditing(null);
    setFormOpen(true);
    router.replace(pathname);
  }, [searchParams, router, pathname]);

  useEffect(() => {
    const report = searchParams.get("nota");
    if (report) {
      setTab("reports");
      setOpenReport(report);
    }
  }, [searchParams]);

  if (isLoading || !context) {
    return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!included) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{context.canApprove ? t("title") : t("titleMine")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
        </div>
        <UpgradeRequired feature="hasExpenseClaims" />
      </div>
    );
  }

  const cannotRegister = !context.employee && (!canApprove || employees.length === 0);

  function openNew() {
    setEditing(null);
    setPrefill(undefined);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{canApprove ? t("title") : t("titleMine")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
        </div>
        {!cannotRegister && (
          <Button onClick={openNew} className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" /> {t("newClaim")}
          </Button>
        )}
      </div>

      {cannotRegister ? (
        <Card>
          <CardContent className="py-14 text-center space-y-2">
            <Receipt className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="font-medium">{canApprove ? t("noEmployees.titleAdmin") : t("noEmployees.titleEmployee")}</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {canApprove ? t("noEmployees.bodyAdmin") : t("noEmployees.bodyEmployee")}
            </p>
            {canApprove && (
              <Button asChild variant="outline" className="mt-2">
                <LocaleLink href="/empleados">{t("noEmployees.cta")}</LocaleLink>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto">
            <TabsList>
              <TabsTrigger value="claims">{canApprove ? t("tabs.claims") : t("tabs.claimsMine")}</TabsTrigger>
              <TabsTrigger value="reports" className="gap-1.5">
                {canApprove ? t("tabs.reports") : t("tabs.reportsMine")}
                {canApprove && pendingReports.length > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white tabular-nums">{pendingReports.length}</span>
                )}
              </TabsTrigger>
              {canApprove && <TabsTrigger value="cards">{t("tabs.cards")}</TabsTrigger>}
              {canApprove && <TabsTrigger value="analytics">{t("tabs.analytics")}</TabsTrigger>}
              {canApprove && <TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>}
            </TabsList>
          </div>
          <TabsContent value="claims" className="space-y-4">
            {context.employee && advanced && <EmailAddressCard employeeEmail={me?.email ?? null} />}
            <ClaimsTab
              context={context}
              employees={employees}
              onNew={openNew}
              onEdit={(c) => { setEditing(c); setPrefill(undefined); setFormOpen(true); }}
            />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab context={context} onOpen={setOpenReport} />
          </TabsContent>
          {canApprove && (
            <TabsContent value="cards">
              {advanced ? <ExpenseCards employees={employees} /> : <UpgradeRequired feature="hasExpenseAdvanced" compact />}
            </TabsContent>
          )}
          {canApprove && (
            <TabsContent value="analytics">
              <ExpenseAnalytics />
            </TabsContent>
          )}
          {canApprove && (
            <TabsContent value="settings">
              <ExpenseSettingsPanel context={context} />
            </TabsContent>
          )}
        </Tabs>
      )}

      {formOpen && (
        <ExpenseClaimForm
          key={editing?.id ?? `new-${prefill?.receiptUrl ?? ""}`}
          open={formOpen}
          onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditing(null); setPrefill(undefined); } }}
          claim={editing}
          prefill={prefill}
          context={context}
          employees={employees}
        />
      )}

      <ExpenseReportDetail reportId={openReport} onClose={() => setOpenReport(null)} settings={context.settings} />
    </div>
  );
}
