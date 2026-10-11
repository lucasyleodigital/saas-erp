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
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { AlertTriangle, ChevronRight, Loader2, Paperclip, Pencil, Plus, Receipt, Send, Trash2 } from "lucide-react";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_VARIANT,
  useCreateExpenseReport,
  useDeleteExpenseClaim,
  useExpenseClaims,
  useExpenseContext,
  useExpenseReports,
  warningsOf,
  type ExpenseClaim,
  type ExpenseContext,
} from "@/hooks/use-expense-claims";
import { ExpenseClaimForm, type ClaimPrefill } from "./expense-claim-form";
import { ExpenseReportDetail, WarningIcons, claimDetail } from "./expense-report-detail";
import { ExpenseAnalytics } from "./expense-analytics";
import { ExpenseSettingsPanel } from "./expense-settings";

type ClaimFilter = "todo" | "open" | "PENDING" | "APPROVED" | "REIMBURSED" | "all";
const CLAIM_FILTERS: { value: ClaimFilter; label: string; status?: string; unreported?: boolean }[] = [
  { value: "open", label: "Por enviar", unreported: true },
  { value: "PENDING", label: "En aprobación", status: "PENDING" },
  { value: "APPROVED", label: "Aprobados", status: "APPROVED" },
  { value: "REIMBURSED", label: "Reembolsados", status: "REIMBURSED" },
  { value: "all", label: "Todos" },
];

const REPORT_FILTERS = [
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Por reembolsar" },
  { value: "REIMBURSED", label: "Reembolsadas" },
  { value: "REJECTED", label: "Rechazadas" },
  { value: "all", label: "Todas" },
];

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

function ClaimsTab({ context, employees, onEdit, onNew }: {
  context: ExpenseContext;
  employees: { id: string; name: string }[];
  onEdit: (c: ExpenseClaim) => void;
  onNew: () => void;
}) {
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
        <FilterChips value={filter} onChange={setFilter} options={CLAIM_FILTERS} />
        {context.canApprove && (
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar por empleado"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los empleados</SelectItem>
              {context.employee && <SelectItem value="mine">Mis gastos</SelectItem>}
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {filter === "open" && claims.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {claims.length} gasto(s) por enviar · {formatCurrency(openTotal)}. Selecciónalos y crea una nota de gasto para enviarlos a aprobación.
        </p>
      )}

      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border bg-background/95 backdrop-blur px-4 py-3 shadow-sm">
          <span className="text-sm">
            <strong>{selected.size}</strong> seleccionado(s) · <strong className="tabular-nums">{formatCurrency(selectedTotal)}</strong>
            {mixedEmployees && <span className="block text-xs text-destructive">Una nota solo puede incluir gastos de un empleado.</span>}
          </span>
          <Button size="sm" onClick={() => setReportDialog(true)} disabled={mixedEmployees}>
            <Send className="h-4 w-4 mr-1.5" /> Crear nota de gasto
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
              <p className="font-medium">{filter === "open" ? "No tienes gastos pendientes de enviar" : "No hay gastos con este filtro"}</p>
              <p className="text-sm text-muted-foreground mt-1">Fotografía un ticket o registra kilómetros y dietas en segundos.</p>
            </div>
            <Button onClick={onNew}><Plus className="h-4 w-4 mr-1.5" /> Nuevo gasto</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5" />
                <th className="px-3 py-2.5 text-left font-medium">Fecha</th>
                <th className="px-3 py-2.5 text-left font-medium">Concepto</th>
                {showEmployee && <th className="px-3 py-2.5 text-left font-medium hidden md:table-cell">Empleado</th>}
                <th className="px-3 py-2.5 text-left font-medium hidden lg:table-cell">Proyecto</th>
                <th className="px-3 py-2.5 text-right font-medium">Importe</th>
                <th className="px-3 py-2.5 text-left font-medium">Estado</th>
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
                          aria-label="Seleccionar gasto"
                          checked={selected.has(c.id)}
                          onChange={() => toggle(c.id)}
                          className="h-4 w-4 accent-primary"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatDate(c.date)}</td>
                    <td className="px-3 py-2.5 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{CATEGORY_LABELS[c.category]}</span>
                        {c.receiptUrl && (
                          <a href={c.receiptUrl} target="_blank" rel="noreferrer" title="Ver justificante" className="text-muted-foreground hover:text-primary">
                            <Paperclip className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <WarningIcons claim={c} />
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[280px]">{claimDetail(c)}</div>
                      {c.status === "REJECTED" && c.rejectionReason && (
                        <div className="text-xs text-destructive">Rechazado: {c.rejectionReason}</div>
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
                      {formatCurrency(Number(c.amount))}
                      {c.paidWithCompanyCard && <div className="text-[10px] font-normal text-muted-foreground">Tarjeta empresa</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                      {c.report && <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{c.report.number}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      {editable && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(c)} aria-label="Editar gasto">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => del.mutate(c.id)}
                            disabled={del.isPending}
                            aria-label="Eliminar gasto"
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
          <DialogHeader><DialogTitle>Enviar nota de gasto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selected.size} gasto(s) por {formatCurrency(selectedTotal)} irán a aprobación. Mientras esté pendiente puedes retirarla.
            </p>
            {selectedClaims.some((c) => warningsOf(c).length > 0) && (
              <p className="flex items-start gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                Algunos gastos tienen avisos de política. Quien apruebe los verá.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="report-title">Título (opcional)</Label>
              <Input id="report-title" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="Viaje a Madrid, feria Alimentaria..." />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReportDialog(false)}>Cancelar</Button>
            <Button onClick={sendReport} disabled={createReport.isPending}>
              {createReport.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Enviar a aprobación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportsTab({ context, onOpen }: { context: ExpenseContext; onOpen: (id: string) => void }) {
  const [status, setStatus] = useState(context.canApprove ? "PENDING" : "all");
  const { data: reports = [], isLoading } = useExpenseReports(status === "all" ? undefined : { status });

  return (
    <div className="space-y-4">
      <FilterChips value={status} onChange={setStatus} options={REPORT_FILTERS} />
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="font-medium">{status === "PENDING" ? "No hay notas pendientes de aprobar" : "No hay notas de gasto con este filtro"}</p>
            <p className="text-sm text-muted-foreground mt-1">Las notas se crean agrupando gastos desde la pestaña de gastos.</p>
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
                  {r.employee.firstName} {r.employee.lastName} · {formatDate(r.submittedAt)} · {r._count?.claims ?? 0} gasto(s)
                  {r.payroll && r.status === "APPROVED" ? ` · en nómina ${r.payroll.month}/${r.payroll.year}` : ""}
                </div>
              </div>
              {(r.warningsCount ?? 0) > 0 && r.status === "PENDING" && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" title="Avisos de política">
                  <AlertTriangle className="h-3.5 w-3.5" /> {r.warningsCount}
                </span>
              )}
              <div className="text-right shrink-0">
                <div className="font-semibold tabular-nums">
                  {formatCurrency(Number(r.status === "PENDING" || r.status === "REJECTED" ? r.total : r.approvedTotal))}
                </div>
                <Badge variant={STATUS_VARIANT[r.status]} className="mt-0.5">{STATUS_LABELS[r.status]}</Badge>
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: context, isLoading } = useExpenseContext();
  const canApprove = !!context?.canApprove;

  const { data: employeesData } = useQuery<{ data: { id: string; firstName: string; lastName: string }[] }>({
    queryKey: ["employees", { status: "ACTIVE", limit: 200 }],
    queryFn: () => api.get("/employees", { params: { status: "ACTIVE", limit: 200 } }).then((r) => r.data),
    enabled: canApprove,
  });
  const employees = useMemo(
    () => (employeesData?.data ?? []).map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`.trim() })),
    [employeesData],
  );
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
          <h1 className="text-2xl font-bold">{canApprove ? "Gastos de empleados" : "Mis gastos"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tickets, kilometraje y dietas. Al aprobarse se contabilizan y se reembolsan en nómina o por transferencia.
          </p>
        </div>
        {!cannotRegister && (
          <Button onClick={openNew} className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" /> Nuevo gasto
          </Button>
        )}
      </div>

      {cannotRegister ? (
        <Card>
          <CardContent className="py-14 text-center space-y-2">
            <Receipt className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="font-medium">
              {canApprove ? "Aún no tienes empleados" : "Tu usuario no está vinculado a ningún empleado"}
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {canApprove
                ? "Los gastos se registran por empleado. Da de alta a tu equipo (y a ti con tu email si también tienes gastos) para empezar."
                : "Pide a administración que te dé de alta como empleado con el mismo email con el que accedes."}
            </p>
            {canApprove && (
              <Button asChild variant="outline" className="mt-2">
                <LocaleLink href="/empleados">Ir a empleados</LocaleLink>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto">
            <TabsList>
              <TabsTrigger value="claims">{canApprove ? "Gastos" : "Mis gastos"}</TabsTrigger>
              <TabsTrigger value="reports" className="gap-1.5">
                {canApprove ? "Notas de gasto" : "Mis notas"}
                {canApprove && pendingReports.length > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white tabular-nums">{pendingReports.length}</span>
                )}
              </TabsTrigger>
              {canApprove && <TabsTrigger value="analytics">Análisis</TabsTrigger>}
              {canApprove && <TabsTrigger value="settings">Configuración</TabsTrigger>}
            </TabsList>
          </div>
          <TabsContent value="claims">
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
