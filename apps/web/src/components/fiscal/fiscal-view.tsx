"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  useFiscalCalendar, useAnnualSummary, useM303, useM130, useM111, useM202,
  useFiscalPeriods, useMarkFiled, useExpenses, useCreateExpense, useDeleteExpense,
  useUpdateExpense, useAnalyzeExpense,
} from "@/hooks/use-fiscal";
import { usePendingPurchaseOrders, useReceiveAllPurchaseOrder } from "@/hooks/use-purchase-orders";
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
  TrendingDown, Receipt, ExternalLink, Upload, Paperclip, X as XIcon, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  if (overdue) return <Badge variant="destructive">!</Badge>;
  if (daysLeft <= 7) return <Badge className="bg-red-100 text-red-700 border-red-200">{daysLeft}d</Badge>;
  if (daysLeft <= 20) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">{daysLeft}d</Badge>;
  return <Badge variant="secondary">{daysLeft}d</Badge>;
}

// ── Modelo Card ────────────────────────────────────────────────────────────────
function ModeloCard({
  title, subtitle, children, filed, onMarkFiled, isPending, filedLabel, markFiledLabel,
}: {
  title: string; subtitle: string; children: React.ReactNode;
  filed?: boolean; onMarkFiled?: () => void; isPending?: boolean;
  filedLabel: string; markFiledLabel: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Card className={cn("border", filed && "border-green-500/30 bg-green-500/5")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            {filed && <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />{filedLabel}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {!filed && onMarkFiled && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onMarkFiled} disabled={isPending}>
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                {markFiledLabel}
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

// ── Edit Expense Dialog ────────────────────────────────────────────────────────
function EditExpenseDialog({ expense, onOpenChange }: { expense: any | null; onOpenChange: (v: boolean) => void }) {
  const update = useUpdateExpense();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (expense) {
      setForm({
        date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : "",
        description: expense.description ?? "",
        supplier: expense.supplier ?? "",
        supplierNif: expense.supplierNif ?? "",
        invoiceRef: expense.invoiceRef ?? "",
        subtotal: String(expense.subtotal ?? ""),
        vatRate: String(expense.vatRate ?? "21"),
        withholdingRate: expense.withholdingRate != null ? String(expense.withholdingRate) : "",
        category: expense.category ?? "OTROS",
      });
    }
  }, [expense]);

  function set(k: string, v: string) { setForm((p: any) => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await update.mutateAsync({ id: expense.id, data: form });
    onOpenChange(false);
  }

  const vatAmount = form.subtotal ? +(Number(form.subtotal) * Number(form.vatRate) / 100).toFixed(2) : 0;
  const total = form.subtotal ? +(Number(form.subtotal) + vatAmount).toFixed(2) : 0;

  return (
    <Dialog open={!!expense} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary" />Editar gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Fecha</Label><Input type="date" value={form.date ?? ""} onChange={(e) => set("date", e.target.value)} required /></div>
            <div className="space-y-1">
              <Label>Categoría</Label>
              <select className="w-full h-9 border rounded-md px-3 text-sm bg-background" value={form.category ?? "OTROS"} onChange={(e) => set("category", e.target.value)}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1"><Label>Descripción</Label><Input value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Proveedor</Label><Input value={form.supplier ?? ""} onChange={(e) => set("supplier", e.target.value)} /></div>
            <div className="space-y-1"><Label>NIF proveedor</Label><Input placeholder="B12345678" value={form.supplierNif ?? ""} onChange={(e) => set("supplierNif", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Nº factura</Label><Input placeholder="INV-001" value={form.invoiceRef ?? ""} onChange={(e) => set("invoiceRef", e.target.value)} /></div>
            <div className="space-y-1">
              <Label>IVA</Label>
              <select className="w-full h-9 border rounded-md px-3 text-sm bg-background" value={form.vatRate ?? "21"} onChange={(e) => set("vatRate", e.target.value)}>
                <option value="0">0% (exento)</option>
                <option value="4">4% (superreducido)</option>
                <option value="10">10% (reducido)</option>
                <option value="21">21% (general)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Base imponible (€)</Label><Input type="number" step="0.01" placeholder="0.00" value={form.subtotal ?? ""} onChange={(e) => set("subtotal", e.target.value)} required /></div>
            <div className="space-y-1">
              <Label>Retención IRPF (%)</Label>
              <select className="w-full h-9 border rounded-md px-3 text-sm bg-background" value={form.withholdingRate ?? ""} onChange={(e) => set("withholdingRate", e.target.value)}>
                <option value="">Sin retención</option>
                <option value="7">7% (inicio actividad)</option>
                <option value="15">15% (profesionales)</option>
                <option value="19">19% (arrendamientos)</option>
              </select>
            </div>
          </div>
          {form.subtotal && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA {form.vatRate}%: {formatCurrency(vatAmount)}</span>
                {form.withholdingRate && <span className="text-amber-600">Retención {form.withholdingRate}%: −{formatCurrency(+(Number(form.subtotal) * Number(form.withholdingRate) / 100).toFixed(2))}</span>}
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Expense Dialog ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  date: new Date().toISOString().split("T")[0],
  description: "", supplier: "", supplierNif: "", invoiceRef: "",
  subtotal: "", vatRate: "21", withholdingRate: "", category: "OTROS", attachmentUrl: "",
};

function AddExpenseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("fiscal.addExpense");
  const create = useCreateExpense();
  const analyze = useAnalyzeExpense();
  const receiveAll = useReceiveAllPurchaseOrder();
  const { data: pendingPos } = usePendingPurchaseOrders();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkedPoId, setLinkedPoId] = useState("");

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  function handlePoLink(poId: string) {
    setLinkedPoId(poId);
    if (!poId) return;
    const po = (pendingPos?.data?.data ?? []).find((p: any) => p.id === poId);
    if (!po) return;
    setForm((prev) => ({
      ...prev,
      supplier: po.supplier?.name ?? prev.supplier,
      invoiceRef: po.number,
      subtotal: String(Number(po.subtotal).toFixed(2)),
      description: prev.description || `Factura OC ${po.number}`,
    }));
  }

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const result = await analyze.mutateAsync(file);
    const ex = result.extracted;
    setForm((p) => ({
      ...p,
      ...(ex.date        && { date:        ex.date }),
      ...(ex.description && { description: ex.description }),
      ...(ex.supplier    && { supplier:    ex.supplier }),
      ...(ex.supplierNif && { supplierNif: ex.supplierNif }),
      ...(ex.invoiceRef  && { invoiceRef:  ex.invoiceRef }),
      ...(ex.subtotal    && { subtotal:    String(ex.subtotal) }),
      ...(ex.vatRate     !== undefined && { vatRate: String(ex.vatRate) }),
      ...(ex.category    && { category:   ex.category }),
      ...(result.attachmentUrl && { attachmentUrl: result.attachmentUrl }),
    }));
  }, [analyze]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync(form);
    if (linkedPoId) {
      await receiveAll.mutateAsync(linkedPoId).catch(() => {});
    }
    onOpenChange(false);
    setForm(EMPTY_FORM);
    setFileName(null);
    setLinkedPoId("");
  }

  const vatAmount = form.subtotal ? +(Number(form.subtotal) * Number(form.vatRate) / 100).toFixed(2) : 0;
  const total = form.subtotal ? +(Number(form.subtotal) + vatAmount).toFixed(2) : 0;
  const isAnalyzing = analyze.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setForm(EMPTY_FORM); setFileName(null); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" />{t("title")}</DialogTitle>
        </DialogHeader>

        {/* Upload zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/40",
            isAnalyzing && "pointer-events-none opacity-60",
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-primary">Analizando con IA...</p>
            </div>
          ) : fileName ? (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Paperclip className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary truncate max-w-[260px]">{fileName}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); setFileName(null); set("attachmentUrl", ""); }}
                className="text-muted-foreground hover:text-destructive">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Upload className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium">Sube la factura o foto del ticket</p>
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG — la IA rellenará los campos automáticamente</p>
            </div>
          )}
        </div>

        {/* Vincular a OC pendiente */}
        {(pendingPos?.data?.data ?? []).length > 0 && (
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-sm">
              <Receipt className="h-3.5 w-3.5 text-primary" />
              Vincular a orden de compra pendiente
            </Label>
            <select
              className="w-full h-9 border rounded-md px-3 text-sm bg-background"
              value={linkedPoId}
              onChange={(e) => handlePoLink(e.target.value)}
            >
              <option value="">— Sin vincular —</option>
              {(pendingPos?.data?.data ?? []).map((po: any) => (
                <option key={po.id} value={po.id}>
                  {po.number} · {po.supplier?.name ?? "Proveedor"} · {Number(po.total).toFixed(2)}€
                </option>
              ))}
            </select>
            {linkedPoId && (
              <p className="text-xs text-emerald-600">
                Al guardar, la OC se marcará como recibida automáticamente.
              </p>
            )}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>{t("date")}</Label><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required /></div>
            <div className="space-y-1">
              <Label>{t("category")}</Label>
              <select className="w-full h-9 border rounded-md px-3 text-sm bg-background" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1"><Label>{t("description")}</Label><Input placeholder={t("descPlaceholder")} value={form.description} onChange={(e) => set("description", e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>{t("supplier")}</Label><Input placeholder={t("supplierPlaceholder")} value={form.supplier} onChange={(e) => set("supplier", e.target.value)} /></div>
            <div className="space-y-1"><Label>NIF proveedor</Label><Input placeholder="B12345678" value={form.supplierNif} onChange={(e) => set("supplierNif", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>{t("invoiceRef")}</Label><Input placeholder="INV-001" value={form.invoiceRef} onChange={(e) => set("invoiceRef", e.target.value)} /></div>
            <div className="space-y-1">
              <Label>{t("vat")}</Label>
              <select className="w-full h-9 border rounded-md px-3 text-sm bg-background" value={form.vatRate} onChange={(e) => set("vatRate", e.target.value)}>
                <option value="0">{t("vat0")}</option>
                <option value="4">{t("vat4")}</option>
                <option value="10">{t("vat10")}</option>
                <option value="21">{t("vat21")}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>{t("base")}</Label><Input type="number" step="0.01" placeholder="0.00" value={form.subtotal} onChange={(e) => set("subtotal", e.target.value)} required /></div>
            <div className="space-y-1">
              <Label>Retención IRPF (%)</Label>
              <select className="w-full h-9 border rounded-md px-3 text-sm bg-background" value={form.withholdingRate} onChange={(e) => set("withholdingRate", e.target.value)}>
                <option value="">Sin retención</option>
                <option value="7">7% (inicio actividad)</option>
                <option value="15">15% (profesionales)</option>
                <option value="19">19% (arrendamientos)</option>
              </select>
            </div>
          </div>
          {form.subtotal && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("vatSummary", { rate: form.vatRate, amount: formatCurrency(vatAmount) })}</span>
                {form.withholdingRate && <span className="text-amber-600">Retención {form.withholdingRate}%: −{formatCurrency(+(Number(form.subtotal) * Number(form.withholdingRate) / 100).toFixed(2))}</span>}
              </div>
              <div className="flex justify-between font-semibold">
                <span>{t("total", { amount: "" })}</span>
                <span>{formatCurrency(+(Number(form.subtotal) + vatAmount - (form.withholdingRate ? Number(form.subtotal) * Number(form.withholdingRate) / 100 : 0)).toFixed(2) as unknown as number)}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={create.isPending || isAnalyzing}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────
export function FiscalView() {
  const t = useTranslations("fiscal");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQ = Math.floor(now.getMonth() / 3) + 1;
  const isFilingWindow = now.getDate() <= 20 && currentQ > 1;
  const defaultQ = isFilingWindow ? currentQ - 1 : currentQ;

  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(defaultQ);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "m303" | "m130" | "m111" | "m202" | "gastos">("dashboard");
  const [m202Period, setM202Period] = useState(1);

  const { data: m111 } = useM111(year, quarter);
  const { data: m202 } = useM202(year, m202Period);
  const { data: calendar } = useFiscalCalendar(year);
  const { data: annual } = useAnnualSummary(year);
  const { data: m303 } = useM303(year, quarter);
  const { data: m130 } = useM130(year, quarter);
  const { data: periods } = useFiscalPeriods(year);
  const { data: expenses } = useExpenses({ year, quarter });
  const markFiled = useMarkFiled();
  const deleteExpense = useDeleteExpense();
  const [editingExpense, setEditingExpense] = useState<any | null>(null);

  const QUARTER_LABELS = ["", t("quarters.q1"), t("quarters.q2"), t("quarters.q3"), t("quarters.q4")];

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
    { id: "dashboard", label: t("tabs.dashboard") },
    { id: "m303", label: t("tabs.m303") },
    { id: "m130", label: t("tabs.m130") },
    { id: "m111", label: t("tabs.m111") },
    { id: "m202", label: t("tabs.m202") },
    { id: "gastos", label: t("tabs.gastos") },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
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
              <span className="text-muted-foreground ml-auto">{t("overdue")}</span>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("dashboard.income", { year })}</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(annual.ingresos)}</p>
              <p className="text-xs text-muted-foreground">{annual.invoiceCount} {t("m303.invoices", { count: "" }).replace(" ", "")}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("dashboard.expenses", { year })}</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(annual.gastos)}</p>
              <p className="text-xs text-muted-foreground">{annual.expenseCount}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("dashboard.netIncome")}</p>
              <p className={cn("text-xl font-bold", annual.rendimientoNeto >= 0 ? "text-primary" : "text-destructive")}>{formatCurrency(annual.rendimientoNeto)}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.irpfBase")}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("dashboard.ivaResult")}</p>
              <p className="text-xl font-bold">{formatCurrency(annual.ivaResultado)}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.ivaSubtitle")}</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t("dashboard.statusTitle", { year })}</CardTitle></CardHeader>
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
                              <span className={cn(filed ? "text-green-700 dark:text-green-400" : past ? "text-amber-600" : "text-muted-foreground")}>{t("dashboard.mod", { num: m })}</span>
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

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4" />{t("dashboard.calendarTitle", { year })}</CardTitle>
                <a href="https://sede.agenciatributaria.gob.es" target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  {t("aeatLink")} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {(calendar as any[])?.map((d: any) => (
                  <div key={d.label} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                    <span className={cn(d.overdue ? "text-muted-foreground line-through" : "")}>{d.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(d.deadline).toLocaleDateString()}</span>
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
              <p className="text-xs text-muted-foreground">{t("m303.vatCharged")}</p>
              <p className="text-lg font-bold text-green-600">+{formatCurrency(m303.repercutido.cuota)}</p>
              <p className="text-xs text-muted-foreground">{t("m303.invoices", { count: m303.repercutido.invoiceCount })}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t("m303.vatDeductible")}</p>
              <p className="text-lg font-bold text-red-500">−{formatCurrency(m303.soportado.cuota)}</p>
              <p className="text-xs text-muted-foreground">{t("m303.expenses", { count: m303.soportado.expenseCount })}</p>
            </CardContent></Card>
            <Card className={cn(m303.resultado > 0 ? "border-primary/30" : "border-green-500/30")}>
              <CardContent className="p-4 text-center">
                <Calculator className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t("m303.result")}</p>
                <p className={cn("text-lg font-bold", m303.resultado > 0 ? "text-primary" : "text-green-600")}>{formatCurrency(m303.resultado)}</p>
                <p className="text-xs text-muted-foreground">{m303.resultado > 0 ? t("m303.toPay") : t("m303.toReturn")}</p>
              </CardContent>
            </Card>
          </div>

          <ModeloCard
            title={`${t("tabs.m303")} — ${QUARTER_LABELS[quarter]} ${year}`}
            subtitle={`${t("deadline")}: ${new Date(m303.period.deadline).toLocaleDateString()} · IVA trimestral`}
            filed={periodStatus?.model303Filed}
            onMarkFiled={() => handleMarkFiled("model303", m303.resultado)}
            isPending={markFiled.isPending}
            filedLabel={t("filed")}
            markFiledLabel={t("markFiled")}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">{t("m303.sectionCharged")}</p>
            <CasillaRow num="01" label={t("m303.c01")} value={m303.casillas.c01} />
            <CasillaRow num="03" label={t("m303.c03")} value={m303.casillas.c03} />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-3 pb-1">{t("m303.sectionDeductible")}</p>
            <CasillaRow num="28" label={t("m303.c28")} value={m303.soportado.base} />
            <CasillaRow num="29" label={t("m303.c29")} value={m303.soportado.cuota} />
            <div className="mt-2 border-t pt-2">
              <CasillaRow num="46" label={t("m303.c46")} value={m303.casillas.c46} highlight />
            </div>
            <div className="mt-3 bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">{t("howToFile")}</p>
              <p>1. {t("m303.how1")}</p>
              <p>2. {t("m303.how2")}</p>
              <p>3. {t("m303.how3")}</p>
              <p>4. {t("m303.how4")}</p>
            </div>
          </ModeloCard>
        </div>
      )}

      {/* ── MODELO 130 ── */}
      {activeTab === "m130" && m130 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t("m130.incomeYTD", { year })}</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(m130.ingresosYTD)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t("m130.expensesYTD", { year })}</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(m130.gastosYTD)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t("m130.retentions")}</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(m130.retencionesYTD)}</p>
            </CardContent></Card>
            <Card className="border-primary/30"><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t("m130.toPay")}</p>
              <p className="text-lg font-bold">{formatCurrency(m130.aIngresar)}</p>
              {m130.aIngresar === 0 && <p className="text-xs text-green-600">{t("m130.zeroNote")}</p>}
            </CardContent></Card>
          </div>

          <ModeloCard
            title={`${t("tabs.m130")} — ${QUARTER_LABELS[quarter]} ${year}`}
            subtitle={`${t("deadline")}: ${new Date(m130.period.deadline).toLocaleDateString()} · IRPF`}
            filed={periodStatus?.model130Filed}
            onMarkFiled={() => handleMarkFiled("model130", m130.aIngresar)}
            isPending={markFiled.isPending}
            filedLabel={t("filed")}
            markFiledLabel={t("markFiled")}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">{t("m130.sectionCalc")}</p>
            <CasillaRow num="01" label={t("m130.c01")} value={m130.casillas.c01} />
            <CasillaRow num="02" label={t("m130.c02")} value={-m130.casillas.c02} />
            <CasillaRow num="03" label={t("m130.c03")} value={m130.casillas.c03} />
            <CasillaRow num="05" label={t("m130.c05")} value={m130.casillas.c05} />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-3 pb-1">{t("m130.sectionDeductions")}</p>
            <CasillaRow num="14" label={t("m130.c14")} value={-m130.casillas.c14} />
            <CasillaRow num="15" label={t("m130.c15", { year })} value={-m130.casillas.c15} />
            <div className="mt-2 border-t pt-2">
              <CasillaRow num="16" label={t("m130.c16")} value={m130.casillas.c16} highlight />
            </div>
            {m130.aIngresar === 0 && (
              <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-xs text-green-700 dark:text-green-400">
                {t("m130.zeroAlert")}
              </div>
            )}
            <div className="mt-3 bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">{t("howToFile")}</p>
              <p>1. {t("m130.how1")}</p>
              <p>2. {t("m130.how2")}</p>
              <p>3. {t("m130.how3")}</p>
            </div>
          </ModeloCard>
        </div>
      )}

      {/* ── MODELO 111 ── */}
      {activeTab === "m111" && m111 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Base de retención</p>
              <p className="text-lg font-bold">{formatCurrency(m111.retencionesAProveedores.base)}</p>
              <p className="text-xs text-muted-foreground">Facturas de profesionales</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Tipo medio aplicado</p>
              <p className="text-lg font-bold text-primary">{m111.retencionesAProveedores.tipoMedio}%</p>
            </CardContent></Card>
            <Card className="border-primary/30"><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">A ingresar a Hacienda</p>
              <p className="text-lg font-bold">{formatCurrency(m111.aIngresar)}</p>
            </CardContent></Card>
          </div>

          {m111.nota && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <strong>Nota:</strong> {m111.nota}
            </div>
          )}

          <ModeloCard
            title={`Modelo 111 — ${QUARTER_LABELS[quarter]} ${year}`}
            subtitle={`Vencimiento: ${new Date(m111.period.deadline).toLocaleDateString()} · Retenciones IRPF`}
            filed={periodStatus?.model111Filed}
            onMarkFiled={() => handleMarkFiled("model111", m111.aIngresar)}
            isPending={markFiled.isPending}
            filedLabel={t("filed")}
            markFiledLabel={t("markFiled")}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">Rendimientos del trabajo y actividades económicas</p>
            <CasillaRow num="01" label="Nº de perceptores" value={0} />
            <CasillaRow num="03" label="Base de retención e ingresos a cuenta" value={m111.casillas.c03} />
            <CasillaRow num="04" label="Tipo medio (%)" value={m111.casillas.c04} />
            <CasillaRow num="05" label="Retenciones e ingresos a cuenta" value={m111.casillas.c05} />
            {m111.retencionesDeClientes.retenciones > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-3 pb-1">Retenciones que te practican los clientes (info)</p>
                <CasillaRow num="—" label="Base (facturas emitidas con retención)" value={m111.retencionesDeClientes.base} />
                <CasillaRow num="—" label="IRPF retenido por clientes" value={m111.retencionesDeClientes.retenciones} />
              </>
            )}
            <div className="mt-2 border-t pt-2">
              <CasillaRow num="06" label="Total a ingresar / devolver" value={m111.casillas.c06} highlight />
            </div>
            <div className="mt-3 bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Cómo presentarlo</p>
              <p>1. Accede a la Sede Electrónica de la AEAT (sede.agenciatributaria.gob.es)</p>
              <p>2. Busca "Modelo 111 — Retenciones IRPF"</p>
              <p>3. Cumplimenta con los importes de las casillas 03, 05 y 06</p>
              <p>4. Presenta antes del día 20 del mes siguiente al trimestre</p>
            </div>
          </ModeloCard>
        </div>
      )}

      {/* ── MODELO 202 ── */}
      {activeTab === "m202" && m202 && (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
            <strong>{t("m202.alertTitle")}</strong>
            <p className="mt-1 text-xs opacity-80">{t("m202.alertBody")}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t("m202.period")}:</span>
            {[
              { p: 1, label: t("m202.p1") },
              { p: 2, label: t("m202.p2") },
              { p: 3, label: t("m202.p3") },
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
              <p className="text-xs text-muted-foreground">{t("m202.income")}</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(m202.ingresos)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t("m202.expenses")}</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(m202.gastos)}</p>
            </CardContent></Card>
            <Card className="border-primary/30"><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t("m202.installment")}</p>
              <p className="text-lg font-bold">{formatCurrency(m202.pagoFraccionado)}</p>
              <p className="text-xs text-muted-foreground">{t("m202.installmentNote")}</p>
            </CardContent></Card>
          </div>

          <ModeloCard
            title={`${t("tabs.m202")} — ${[t("m202.p1title"), t("m202.p2title"), t("m202.p3title")][m202Period - 1]} ${year}`}
            subtitle={`${t("deadline")}: ${new Date(m202.deadline).toLocaleDateString()} · IS`}
            filedLabel={t("filed")}
            markFiledLabel={t("markFiled")}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">{t("m202.sectionBase")}</p>
            <CasillaRow num="01" label={t("m202.c01")} value={m202.casillas.c01} />
            <CasillaRow num="02" label={t("m202.c02")} value={-m202.casillas.c02} />
            <CasillaRow num="12" label={t("m202.c12")} value={m202.casillas.c12} />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pt-3 pb-1">{t("m202.sectionQuota")}</p>
            <CasillaRow num="13" label={t("m202.c13", { rate: m202.tipoGravamen })} value={m202.casillas.c13} />
            <div className="mt-2 border-t pt-2">
              <CasillaRow num="14" label={t("m202.c14")} value={m202.casillas.c14} highlight />
            </div>
            <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-medium mb-1">{t("howToFile")}</p>
              <p>{m202.nota}</p>
            </div>
            <div className="mt-2 bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">{t("howToFile")}</p>
              <p>1. {t("m202.how1")}</p>
              <p>2. {t("m202.how2")}</p>
              <p>3. {t("m202.how3")}</p>
            </div>
          </ModeloCard>
        </div>
      )}

      {/* ── GASTOS ── */}
      {activeTab === "gastos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("gastos.title", { quarter: QUARTER_LABELS[quarter] ?? "", year })}</p>
              <p className="text-xs text-muted-foreground">{t("gastos.subtitle")}</p>
            </div>
            <Button className="gap-2" onClick={() => setAddExpenseOpen(true)}>
              <Plus className="h-4 w-4" />{t("gastos.add")}
            </Button>
          </div>

          {expenses?.data?.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">{t("gastos.empty")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("gastos.emptyHint")}</p>
              <Button className="mt-4 gap-2" onClick={() => setAddExpenseOpen(true)}><Plus className="h-4 w-4" />{t("gastos.addFirst")}</Button>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("gastos.colDate")}</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("gastos.colDescription")}</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("gastos.colCategory")}</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("gastos.colBase")}</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("gastos.colVat")}</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("gastos.colTotal")}</th>
                      <th className="w-8 text-center px-2 py-2.5 text-xs font-medium text-muted-foreground"><Paperclip className="h-3 w-3 mx-auto" /></th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.data.map((e: any) => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5">
                          <p>{e.description}</p>
                          {e.supplier && <p className="text-xs text-muted-foreground">{e.supplier}{e.supplierNif ? ` · ${e.supplierNif}` : ""}</p>}
                        </td>
                        <td className="px-4 py-2.5"><Badge variant="secondary" className="text-xs">{e.category}</Badge></td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(Number(e.subtotal))}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatCurrency(Number(e.vatAmount))}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCurrency(Number(e.total))}</td>
                        <td className="px-2 py-2.5 text-center">
                          {e.attachmentUrl && (
                            <a href={e.attachmentUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-7 w-7 rounded text-primary hover:bg-primary/10 transition-colors"
                              title="Ver adjunto">
                              <Paperclip className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditingExpense(e)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteExpense.mutate(e.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/20">
                      <td colSpan={3} className="px-4 py-2.5 text-xs font-medium">{t("gastos.total", { count: expenses.data.length })}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{formatCurrency(expenses.data.reduce((s: number, e: any) => s + Number(e.subtotal), 0))}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground font-semibold">{formatCurrency(expenses.data.reduce((s: number, e: any) => s + Number(e.vatAmount), 0))}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-bold">{formatCurrency(expenses.data.reduce((s: number, e: any) => s + Number(e.total), 0))}</td>
                      <td /><td />
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <AddExpenseDialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen} />
      <EditExpenseDialog expense={editingExpense} onOpenChange={(v) => !v && setEditingExpense(null)} />
    </div>
  );
}

function quarterRange(year: number, q: number) {
  const startMonth = (q - 1) * 3;
  const to = new Date(year, startMonth + 3, 0);
  const from = new Date(year, startMonth, 1);
  return { from, to };
}
