"use client";

import { useState } from "react";
import {
  useFiscalCalendar, useAnnualSummary, useM303, useM130, useM202,
  useFiscalPeriods, useMarkFiled, useExpenses, useCreateExpense, useDeleteExpense,
} from "@/hooks/use-fiscal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import {
  Calculator, CalendarDays, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Plus, Trash2, Loader2, FileText, TrendingUp,
  TrendingDown, Receipt, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const QUARTER_LABELS = ["", "1T (Ene–Mar)", "2T (Abr–Jun)", "3T (Jul–Sep)", "4T (Oct–Dic)"];
const EXPENSE_CATEGORIES = ["SERVICIOS", "SOFTWARE", "MARKETING", "OFICINA", "TRANSPORTE", "FORMACION", "OTROS"];

// ── Casilla Row ────────────────────────────────────────────────────────────────
function CasillaRow({ num, label, value, highlight }: { num: string; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-2 px-3 rounded-lg text-sm", highlight ? "bg-primary/10 font-semibold" : "hover:bg-muted/30")}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">[{num}]</span>
        <span>{label}</span>
      </div>
      <span className={cn("tabular-nums font-medium", value < 0 ? "text-green-600" : value > 0 && highlight ? "text-primary" : "")}>{formatCurrency(value)}</span>
    </div>
  );
}

// ── Deadline Badge ─────────────────────────────────────────────────────────────
function DeadlineBadge({ daysLeft, overdue }: { daysLeft: number; overdue: boolean }) {
  if (overdue) return <Badge variant="destructive">Vencido</Badge>;
  if (daysLeft <= 7) return <Badge className="bg-red-100 text-red-700 border-red-200">{daysLeft}d</Badge>;
  if (daysLeft <= 20) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">{daysLeft}d</Badge>;
  return <Badge variant="secondary">{daysLeft}d</Badge>;
}

// ── Modelo Card ────────────────────────────────────────────────────────────────
function ModeloCard({
  title, subtitle, children, filed, onMarkFiled, isPending,
}: {
  title: string; subtitle: string; children: React.ReactNode;
  filed?: boolean; onMarkFiled?: () => void; isPending?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Card className={cn("border", filed && "border-green-500/30 bg-green-500/5")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            {filed && <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Presentado</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {!filed && onMarkFiled && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onMarkFiled} disabled={isPending}>
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Marcar presentado
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(!open)}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      {open && <CardContent className="pt-0 space-y-1">{children}</CardContent>}
    </Card>
  );
}

// ── Add Expense Dialog ─────────────────────────────────────────────────────────
function AddExpenseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateExpense();
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    supplier: "",
    invoiceRef: "",
    subtotal: "",
    vatRate: "21",
    category: "OTROS",
  });
  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync(form);
    onOpenChange(false);
    setForm({ date: new Date().toISOString().split("T")[0], description: "", supplier: "", invoiceRef: "", subtotal: "", vatRate: "21", category: "OTROS" });
  }

  const vatAmount = form.subtotal ? +(Number(form.subtotal) * Number(form.vatRate) / 100).toFixed(2) : 0;
  const total = form.subtotal ? +(Number(form.subtotal) + vatAmount).toFixed(2) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" />Añadir gasto deducible</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Fecha</Label><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required /></div>
            <div className="space-y-1">
              <Label>Categoría</Label>
              <select className="w-full h-9 border rounded-md px-3 text-sm bg-background" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1"><Label>Descripción *</Label><Input placeholder="Software suscripción, hosting..." value={form.description} onChange={(e) => set("description", e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Proveedor</Label><Input placeholder="Cloudflare, Google..." value={form.supplier} onChange={(e) => set("supplier", e.target.value)} /></div>
            <div className="space-y-1"><Label>Nº factura</Label><Input placeholder="INV-001" value={form.invoiceRef} onChange={(e) => set("invoiceRef", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Base imponible (€) *</Label><Input type="number" step="0.01" placeholder="0.00" value={form.subtotal} onChange={(e) => set("subtotal", e.target.value)} required /></div>
            <div className="space-y-1">
              <Label>IVA (%)</Label>
              <select className="w-full h-9 border rounded-md px-3 text-sm bg-background" value={form.vatRate} onChange={(e) => set("vatRate", e.target.value)}>
                <option value="0">0% (exento)</option>
                <option value="4">4% (superreducido)</option>
                <option value="10">10% (reducido)</option>
                <option value="21">21% (general)</option>
              </select>
            </div>
          </div>
          {form.subtotal && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm flex justify-between">
              <span className="text-muted-foreground">IVA {form.vatRate}%: {formatCurrency(vatAmount)}</span>
              <span className="font-semibold">Total: {formatCurrency(total)}</span>
            </div>
          )}
          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar gasto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────
export function FiscalView() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQ = Math.floor(now.getMonth() / 3) + 1;
  // Si estamos en los primeros 20 días del trimestre, el plazo de presentación
  // del trimestre anterior sigue abierto → mostramos el anterior por defecto
  const isFilingWindow = now.getDate() <= 20 && currentQ > 1;
  const defaultQ = isFilingWindow ? currentQ - 1 : currentQ;

  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(defaultQ);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "m303" | "m130" | "m202" | "gastos">("dashboard");
  const [m202Period, setM202Period] = useState(1);

  const { data: m202 } = useM202(year, m202Period);
  const { data: calendar } = useFiscalCalendar(year);
  const { data: annual } = useAnnualSummary(year);
  const { data: m303 } = useM303(year, quarter);
  const { data: m130 } = useM130(year, quarter);
  const { data: periods } = useFiscalPeriods(year);
  const { data: expenses } = useExpenses({ year, quarter });
  const markFiled = useMarkFiled();
  const deleteExpense = useDeleteExpense();

  const periodStatus = (periods as any[])?.find((p) => p.year === year && p.quarter === quarter);
  const upcomingDeadlines = (calendar as any[])?.filter((d) => !d.overdue && d.daysLeft <= 30) ?? [];
  const overdueItems = (calendar as any[])?.filter((d) => d.overdue) ?? [];

  function handleMarkFiled(model: string, amount: number) {
    markFiled.mutate({
      year, quarter,
      body: {
        [`${model}Filed`]: true,
        [`${model}Amount`]: amount,
        filedAt: new Date().toISOString(),
      },
    });
  }

  const TABS = [
    { id: "dashboard", label: "Resumen" },
    { id: "m303", label: "Modelo 303" },
    { id: "m130", label: "Modelo 130" },
    { id: "m202", label: "Modelo 202 (SL)" },
    { id: "gastos", label: "Gastos" },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Gestión fiscal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Modelos tributarios, gastos deducibles y calendario de obligaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-9 border rounded-md px-3 text-sm bg-background" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => <option key={y}>{y}</option>)}
          </select>
          <select className="h-9 border rounded-md px-3 text-sm bg-background" value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
            {[1, 2, 3, 4].map((q) => <option key={q} value={q}>{QUARTER_LABELS[q]}</option>)}
          </select>
        </div>
      </div>

      {/* Alerts */}
      {(overdueItems.length > 0 || upcomingDeadlines.length > 0) && (
        <div className="space-y-2">
          {overdueItems.map((d: any) => (
            <div key={d.label} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <span className="font-medium text-red-700 dark:text-red-400">{d.label}</span>
              <span className="text-muted-foreground ml-auto">Plazo vencido</span>
            </div>
          ))}
          {upcomingDeadlines.map((d: any) => (
            <div key={d.label} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 text-sm">
              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="font-medium">{d.label}</span>
              <DeadlineBadge daysLeft={d.daysLeft} overdue={d.overdue} />
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", activeTab === tab.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {activeTab === "dashboard" && annual && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Ingresos {year}</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(annual.ingresos)}</p>
              <p className="text-xs text-muted-foreground">{annual.invoiceCount} facturas</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Gastos {year}</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(annual.gastos)}</p>
              <p className="text-xs text-muted-foreground">{annual.expenseCount} registros</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Rendimiento neto</p>
              <p className={cn("text-xl font-bold", annual.rendimientoNeto >= 0 ? "text-primary" : "text-destructive")}>{formatCurrency(annual.rendimientoNeto)}</p>
              <p className="text-xs text-muted-foreground">Base IRPF estimada</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">IVA a ingresar</p>
              <p className="text-xl font-bold">{formatCurrency(annual.ivaResultado)}</p>
              <p className="text-xs text-muted-foreground">Repercutido − soportado</p>
            </CardContent></Card>
          </div>

          {/* Estado trimestres */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Estado de presentaciones {year}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((q) => {
                  const p = (periods as any[])?.find((x) => x.quarter === q);
                  const range = quarterRange(year, q);
                  const past = new Date() > range.to;
                  return (
                    <div key={q} className={cn("border rounded-lg p-3 text-sm", p?.model303Filed && p?.model130Filed ? "border-green-500/30 bg-green-500/5" : past ? "border-amber-500/30 bg-amber-500/5" : "")}>
                      <p className="font-medium mb-2">{QUARTER_LABELS[q]}</p>
                      <div className="space-y-1">
                        {["303", "130"].map((m) => {
                          const filed = p?.[`model${m}Filed`];
                          return (
                            <div key={m} className="flex items-center gap-1.5 text-xs">
                              {filed ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : past ? <AlertTriangle className="h-3 w-3 text-amber-500" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
                              <span className={cn(filed ? "text-green-700 dark:text-green-400" : past ? "text-amber-600" : "text-muted-foreground")}>Mod. {m}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Calendario completo */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4" />Calendario fiscal {year}</CardTitle>
                <a href="https://sede.agenciatributaria.gob.es" target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  Sede AEAT <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {(calendar as any[])?.map((d: any) => (
                  <div key={d.label} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                    <span className={cn(d.overdue ? "text-muted-foreground line-through" : "")}>{d.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(d.deadline).toLocaleDateString("es-ES")}</span>
                      <DeadlineBadge daysLeft={d.daysLeft} overdue={d.overdue} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── MODELO 303 ── */}
      {activeTab === "m303" && m303 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">IVA repercutido</p>
              <p className="text-lg font-bold text-green-600">+{formatCurrency(m303.repercutido.cuota)}</p>
              <p className="text-xs text-muted-foreground">{m303.repercutido.invoiceCount} facturas</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">IVA soportado</p>
              <p className="text-lg font-bold text-red-500">−{formatCurrency(m303.soportado.cuota)}</p>
              <p className="text-xs text-muted-foreground">{m303.soportado.expenseCount} gastos</p>
            </CardContent></Card>
            <Card className={cn(m303.resultado > 0 ? "border-primary/30" : "border-green-500/30")}>
              <CardContent className="p-4 text-center">
                <Calculator className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Resultado</p>
                <p className={cn("text-lg font-bold", m303.resultado > 0 ? "text-primary" : "text-green-600")}>{formatCurrency(m303.resultado)}</p>
                <p className="text-xs text-muted-foreground">{m303.resultado > 0 ? "A ingresar" : "A devolver"}</p>
              </CardContent>
            </Card>
          </div>

          <ModeloCard
            title={`Modelo 303 — ${QUARTER_LABELS[quarter]} ${year}`}
            subtitle={`Plazo: ${new Date(m303.period.deadline).toLocaleDateString("es-ES")} · IVA trimestral`}
            filed={periodStatus?.model303Filed}
            onMarkFiled={() => handleMarkFiled("model303", m303.resultado)}
            isPending={markFiled.isPending}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">IVA Devengado</p>
            <CasillaRow num="01" label="Base imponible operaciones tipo general" value={m303.casillas.c01} />
            <CasillaRow num="03" label="Cuota IVA al 21%" value={m303.casillas.c03} />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-3 pb-1">IVA Deducible</p>
            <CasillaRow num="28" label="Base IVA soportado en operaciones corrientes" value={m303.soportado.base} />
            <CasillaRow num="29" label="Cuota IVA soportado deducible" value={m303.soportado.cuota} />
            <div className="mt-2 border-t pt-2">
              <CasillaRow num="46" label="Resultado (diferencia)" value={m303.casillas.c46} highlight />
            </div>
            <div className="mt-3 bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">¿Cómo presentarlo?</p>
              <p>1. Ve a <strong>sede.agenciatributaria.gob.es</strong> → Modelo 303 → Presentación</p>
              <p>2. Identifícate con Cl@ve PIN o certificado digital</p>
              <p>3. Copia las casillas de arriba en el formulario online</p>
              <p>4. Si el resultado es positivo, domicilia el pago o ingresa en cuenta J</p>
            </div>
          </ModeloCard>
        </div>
      )}

      {/* ── MODELO 130 ── */}
      {activeTab === "m130" && m130 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ingresos acum. {year}</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(m130.ingresosYTD)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Gastos acum. {year}</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(m130.gastosYTD)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Retenciones clientes</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(m130.retencionesYTD)}</p>
            </CardContent></Card>
            <Card className="border-primary/30"><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">A ingresar</p>
              <p className="text-lg font-bold">{formatCurrency(m130.aIngresar)}</p>
              {m130.aIngresar === 0 && <p className="text-xs text-green-600">Resultado 0 — presentar igualmente</p>}
            </CardContent></Card>
          </div>

          <ModeloCard
            title={`Modelo 130 — ${QUARTER_LABELS[quarter]} ${year}`}
            subtitle={`Plazo: ${new Date(m130.period.deadline).toLocaleDateString("es-ES")} · Pago fraccionado IRPF`}
            filed={periodStatus?.model130Filed}
            onMarkFiled={() => handleMarkFiled("model130", m130.aIngresar)}
            isPending={markFiled.isPending}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">Cálculo del rendimiento (acumulado anual)</p>
            <CasillaRow num="01" label="Ingresos computables del año" value={m130.casillas.c01} />
            <CasillaRow num="02" label="Gastos fiscalmente deducibles" value={-m130.casillas.c02} />
            <CasillaRow num="03" label="Rendimiento neto (01 − 02)" value={m130.casillas.c03} />
            <CasillaRow num="05" label="20% del rendimiento neto" value={m130.casillas.c05} />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-3 pb-1">Deducciones</p>
            <CasillaRow num="14" label="Retenciones soportadas acumuladas" value={-m130.casillas.c14} />
            <CasillaRow num="15" label="Pagos fraccionados anteriores {year}" value={-m130.casillas.c15} />
            <div className="mt-2 border-t pt-2">
              <CasillaRow num="16" label="Resultado a ingresar" value={m130.casillas.c16} highlight />
            </div>
            {m130.aIngresar === 0 && (
              <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-xs text-green-700 dark:text-green-400">
                Las retenciones que tus clientes ya han ingresado por ti cubren el pago fraccionado. El resultado es 0. Hay que presentar el modelo igualmente marcando la casilla de "Sin actividad o cuota cero".
              </div>
            )}
            <div className="mt-3 bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">¿Cómo presentarlo?</p>
              <p>1. Ve a <strong>sede.agenciatributaria.gob.es</strong> → Modelo 130 → Presentación</p>
              <p>2. Copia las casillas de arriba</p>
              <p>3. Si el resultado es 0, marca "Resultado negativo o cero" y presenta</p>
            </div>
          </ModeloCard>
        </div>
      )}

      {/* ── MODELO 202 ── */}
      {activeTab === "m202" && m202 && (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
            <strong>Modelo 202 — Impuesto de Sociedades (pago fraccionado)</strong>
            <p className="mt-1 text-xs opacity-80">Solo para empresas con forma jurídica SL o SA. Los autónomos persona física NO presentan este modelo.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Período:</span>
            {[
              { p: 1, label: "1P — Abril" },
              { p: 2, label: "2P — Octubre" },
              { p: 3, label: "3P — Diciembre" },
            ].map(({ p, label }) => (
              <button
                key={p}
                onClick={() => setM202Period(p)}
                className={cn("px-3 py-1.5 rounded-md text-sm border transition-colors", m202Period === p ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ingresos año</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(m202.ingresos)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Gastos deducibles</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(m202.gastos)}</p>
            </CardContent></Card>
            <Card className="border-primary/30"><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pago fraccionado</p>
              <p className="text-lg font-bold">{formatCurrency(m202.pagoFraccionado)}</p>
              <p className="text-xs text-muted-foreground">18% de cuota íntegra</p>
            </CardContent></Card>
          </div>

          <ModeloCard
            title={`Modelo 202 — ${["", "1er pago (abril)", "2º pago (octubre)", "3er pago (diciembre)"][m202Period]} ${year}`}
            subtitle={`Plazo: ${new Date(m202.deadline).toLocaleDateString("es-ES")} · Pago fraccionado IS`}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">Base del cálculo (acumulado año)</p>
            <CasillaRow num="01" label="Ingresos computables del ejercicio" value={m202.casillas.c01} />
            <CasillaRow num="02" label="Gastos fiscalmente deducibles" value={-m202.casillas.c02} />
            <CasillaRow num="12" label="Resultado contable (base)" value={m202.casillas.c12} />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-3 pb-1">Cuota</p>
            <CasillaRow num="13" label={`Cuota íntegra al ${m202.tipoGravamen}%`} value={m202.casillas.c13} />
            <div className="mt-2 border-t pt-2">
              <CasillaRow num="14" label="Pago fraccionado a ingresar (18%)" value={m202.casillas.c14} highlight />
            </div>
            <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-medium mb-1">Nota importante</p>
              <p>{m202.nota}</p>
            </div>
            <div className="mt-2 bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">¿Cómo presentarlo?</p>
              <p>1. Ve a <strong>sede.agenciatributaria.gob.es</strong> → Modelo 202 → Presentación</p>
              <p>2. El administrador/gestor de la SL debe identificarse con certificado de la empresa</p>
              <p>3. Copia los importes de las casillas de arriba</p>
            </div>
          </ModeloCard>
        </div>
      )}

      {/* ── GASTOS ── */}
      {activeTab === "gastos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Gastos deducibles — {QUARTER_LABELS[quarter]} {year}</p>
              <p className="text-xs text-muted-foreground">Guarda aquí las facturas de gastos para calcular el IVA soportado y el rendimiento neto</p>
            </div>
            <Button className="gap-2" onClick={() => setAddExpenseOpen(true)}>
              <Plus className="h-4 w-4" />Añadir gasto
            </Button>
          </div>

          {expenses?.data?.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Sin gastos registrados</p>
              <p className="text-sm text-muted-foreground mt-1">Añade las facturas que recibes de proveedores para calcular el IVA deducible</p>
              <Button className="mt-4 gap-2" onClick={() => setAddExpenseOpen(true)}><Plus className="h-4 w-4" />Añadir primer gasto</Button>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Fecha</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Descripción</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Categoría</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Base</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">IVA</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Total</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.data.map((e: any) => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(e.date).toLocaleDateString("es-ES")}</td>
                        <td className="px-4 py-2.5">
                          <p>{e.description}</p>
                          {e.supplier && <p className="text-xs text-muted-foreground">{e.supplier}</p>}
                        </td>
                        <td className="px-4 py-2.5"><Badge variant="secondary" className="text-xs">{e.category}</Badge></td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(Number(e.subtotal))}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatCurrency(Number(e.vatAmount))}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCurrency(Number(e.total))}</td>
                        <td className="px-2 py-2.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteExpense.mutate(e.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/20">
                      <td colSpan={3} className="px-4 py-2.5 text-xs font-medium">Total {expenses.data.length} gastos</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{formatCurrency(expenses.data.reduce((s: number, e: any) => s + Number(e.subtotal), 0))}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground font-semibold">{formatCurrency(expenses.data.reduce((s: number, e: any) => s + Number(e.vatAmount), 0))}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-bold">{formatCurrency(expenses.data.reduce((s: number, e: any) => s + Number(e.total), 0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <AddExpenseDialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen} />
    </div>
  );
}

function quarterRange(year: number, q: number) {
  const startMonth = (q - 1) * 3;
  const to = new Date(year, startMonth + 3, 0);
  return { to };
}
