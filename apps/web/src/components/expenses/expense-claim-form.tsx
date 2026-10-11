"use client";

import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { Camera, ExternalLink, Loader2, Sparkles, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { useAnalyzeExpense } from "@/hooks/use-fiscal";
import { useVehicles } from "@/hooks/use-fleet";
import { useProjects } from "@/hooks/use-projects";
import {
  CATEGORY_HINTS,
  CATEGORY_LABELS,
  PER_DIEM_LABELS,
  PER_DIEM_SETTING_KEY,
  RECEIPTLESS_CATEGORIES,
  useCreateExpenseClaim,
  useUpdateExpenseClaim,
  type ExpenseCategory,
  type ExpenseClaim,
  type ExpenseContext,
  type PerDiemType,
} from "@/hooks/use-expense-claims";

export interface ClaimPrefill {
  date?: string;
  merchant?: string;
  merchantNif?: string;
  amount?: string;
  vatRate?: string;
  description?: string;
  receiptUrl?: string;
}

interface FormState {
  employeeId: string;
  category: ExpenseCategory;
  date: string;
  merchant: string;
  merchantNif: string;
  description: string;
  amount: string;
  vatRate: string;
  vatDeductible: boolean;
  paidWithCompanyCard: boolean;
  receiptUrl: string;
  distanceKm: string;
  origin: string;
  destination: string;
  perDiemType: PerDiemType;
  perDiemDays: string;
  projectId: string;
  vehicleId: string;
}

const NONE = "__none__";
const today = () => new Date().toISOString().slice(0, 10);
const num = (v: string) => Number(String(v).replace(",", "."));

const FISCAL_TO_CLAIM: Record<string, ExpenseCategory> = {
  TRANSPORTE: "TRANSPORT",
  FORMACION: "TRAINING",
  OFICINA: "SUPPLIES",
};

function initialState(claim: ExpenseClaim | null | undefined, prefill: ClaimPrefill | undefined, defaultEmployeeId: string): FormState {
  if (claim) {
    return {
      employeeId: claim.employeeId,
      category: claim.category,
      date: claim.date.slice(0, 10),
      merchant: claim.merchant ?? "",
      merchantNif: claim.merchantNif ?? "",
      description: claim.description ?? "",
      amount: String(Number(claim.amount)),
      vatRate: String(Number(claim.vatRate)),
      vatDeductible: claim.vatDeductible,
      paidWithCompanyCard: claim.paidWithCompanyCard,
      receiptUrl: claim.receiptUrl ?? "",
      distanceKm: claim.distanceKm != null ? String(Number(claim.distanceKm)) : "",
      origin: claim.origin ?? "",
      destination: claim.destination ?? "",
      perDiemType: claim.perDiemType ?? "ES_OVERNIGHT",
      perDiemDays: claim.perDiemDays != null ? String(Number(claim.perDiemDays)) : "1",
      projectId: claim.projectId ?? "",
      vehicleId: claim.vehicleId ?? "",
    };
  }
  return {
    employeeId: defaultEmployeeId,
    category: "OTHER",
    date: prefill?.date ?? today(),
    merchant: prefill?.merchant ?? "",
    merchantNif: prefill?.merchantNif ?? "",
    description: prefill?.description ?? "",
    amount: prefill?.amount ?? "",
    vatRate: prefill?.vatRate ?? "21",
    vatDeductible: false,
    paidWithCompanyCard: false,
    receiptUrl: prefill?.receiptUrl ?? "",
    distanceKm: "",
    origin: "",
    destination: "",
    perDiemType: "ES_OVERNIGHT",
    perDiemDays: "1",
    projectId: "",
    vehicleId: "",
  };
}

function CheckboxRow({ id, checked, onChange, label, hint }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer select-none">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
      />
      <span className="text-sm leading-tight">
        {label}
        {hint && <span className="block text-xs text-muted-foreground mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

export function ExpenseClaimForm({
  open,
  onOpenChange,
  claim,
  prefill,
  context,
  employees,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  claim?: ExpenseClaim | null;
  prefill?: ClaimPrefill;
  context: ExpenseContext;
  employees: { id: string; name: string }[];
}) {
  const defaultEmployeeId = context.employee?.id ?? employees[0]?.id ?? "";
  const [form, setForm] = useState<FormState>(() => initialState(claim, prefill, defaultEmployeeId));
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = useAnalyzeExpense();
  const create = useCreateExpenseClaim();
  const update = useUpdateExpenseClaim();
  const { data: projectsData } = useProjects({});
  const { data: vehicles = [] } = useVehicles({ activeOnly: "true" });
  const projects: { id: string; name: string }[] = Array.isArray(projectsData) ? projectsData : projectsData?.data ?? [];

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const settings = context.settings;
  const isMileage = form.category === "MILEAGE";
  const isPerDiem = form.category === "PER_DIEM";
  const needsReceipt = !RECEIPTLESS_CATEGORIES.includes(form.category);
  const showVehicle = vehicles.length > 0 && ["FUEL", "TOLLS_PARKING", "TRANSPORT", "OTHER"].includes(form.category);

  let computed: { amount: number; exempt: number; taxable: number; detail: string } | null = null;
  if (isMileage && num(form.distanceKm) > 0) {
    const km = num(form.distanceKm);
    const rate = Number(settings.mileageRate);
    const amount = Math.round(km * rate * 100) / 100;
    const exempt = Math.min(amount, Math.round(km * context.legal.mileageRate * 100) / 100);
    computed = { amount, exempt, taxable: Math.round((amount - exempt) * 100) / 100, detail: `${km} km × ${rate.toFixed(3).replace(".", ",")} €/km` };
  }
  if (isPerDiem && num(form.perDiemDays) > 0) {
    const days = num(form.perDiemDays);
    const rate = Number(settings[PER_DIEM_SETTING_KEY[form.perDiemType]]);
    const amount = Math.round(days * rate * 100) / 100;
    const exempt = Math.min(amount, Math.round(days * context.legal.perDiem[form.perDiemType] * 100) / 100);
    computed = { amount, exempt, taxable: Math.round((amount - exempt) * 100) / 100, detail: `${days} día(s) × ${formatCurrency(rate)}` };
  }

  async function handleReceipt(file: File) {
    try {
      const res = await analyze.mutateAsync(file);
      if (!res.attachmentUrl) {
        toast.warning("No se pudo guardar el archivo. Revisa la configuración de almacenamiento.");
      }
      const ex = res.extracted ?? {};
      const vat = ex.vatRate ?? undefined;
      const total = ex.subtotal !== undefined
        ? Math.round(ex.subtotal * (1 + (vat ?? 0) / 100) * 100) / 100
        : undefined;
      setForm((f) => ({
        ...f,
        receiptUrl: res.attachmentUrl ?? f.receiptUrl,
        date: ex.date ?? f.date,
        merchant: ex.supplier ?? f.merchant,
        merchantNif: ex.supplierNif ?? f.merchantNif,
        description: f.description || ex.description || "",
        amount: total !== undefined ? String(total) : f.amount,
        vatRate: vat !== undefined ? String(vat) : f.vatRate,
        category: f.category === "OTHER" && ex.category && FISCAL_TO_CLAIM[ex.category] ? FISCAL_TO_CLAIM[ex.category]! : f.category,
      }));
      if (res.aiProvider !== "none") toast.success("Datos del ticket leídos. Revísalos antes de guardar.");
    } catch {
      // el hook ya informa del error
    }
  }

  function payload() {
    const base: Record<string, unknown> = {
      category: form.category,
      date: form.date,
      description: form.description,
      projectId: form.projectId || null,
      vehicleId: showVehicle ? form.vehicleId || null : null,
    };
    if (context.canApprove && form.employeeId) base.employeeId = form.employeeId;
    if (isMileage) {
      return { ...base, distanceKm: form.distanceKm, origin: form.origin, destination: form.destination };
    }
    if (isPerDiem) {
      return { ...base, perDiemType: form.perDiemType, perDiemDays: form.perDiemDays };
    }
    return {
      ...base,
      merchant: form.merchant,
      merchantNif: form.merchantNif,
      amount: form.amount,
      vatRate: form.vatRate,
      vatDeductible: form.vatDeductible,
      paidWithCompanyCard: form.paidWithCompanyCard,
      receiptUrl: form.receiptUrl || null,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (claim) await update.mutateAsync({ id: claim.id, ...payload() });
    else await create.mutateAsync(payload());
    onOpenChange(false);
  }

  const pending = create.isPending || update.isPending;
  const amountValid = isMileage ? num(form.distanceKm) > 0 : isPerDiem ? num(form.perDiemDays) > 0 : num(form.amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{claim ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>

        {claim?.status === "REJECTED" && claim.rejectionReason && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Rechazado: {claim.rejectionReason}. Al guardar, el gasto vuelve a borrador.
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {context.canApprove && employees.length > 0 && !claim && (
            <div className="space-y-1.5">
              <Label htmlFor="claim-employee">Empleado</Label>
              <Select value={form.employeeId || undefined} onValueChange={(v) => set("employeeId", v)}>
                <SelectTrigger id="claim-employee"><SelectValue placeholder="Selecciona empleado" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}{e.id === context.employee?.id ? " (tú)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="claim-category">Categoría</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v as ExpenseCategory)}>
                <SelectTrigger id="claim-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{CATEGORY_HINTS[form.category]}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claim-date">Fecha</Label>
              <Input id="claim-date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
            </div>
          </div>

          {needsReceipt && (
            <div className="space-y-1.5">
              <Label>Justificante</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleReceipt(f);
                  e.target.value = "";
                }}
              />
              {form.receiptUrl ? (
                <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <a href={form.receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline min-w-0">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Ver ticket adjunto</span>
                  </a>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={analyze.isPending}>
                      Cambiar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => set("receiptUrl", "")} aria-label="Quitar justificante">
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={analyze.isPending}
                  className={cn(
                    "w-full rounded-lg border-2 border-dashed px-4 py-4 text-sm transition-colors",
                    "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
                    analyze.isPending && "opacity-60 pointer-events-none",
                  )}
                >
                  {analyze.isPending ? (
                    <span className="flex items-center justify-center gap-2 text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" /> Leyendo ticket con IA...
                    </span>
                  ) : (
                    <span className="flex flex-col items-center gap-1">
                      <span className="flex items-center gap-2 font-medium">
                        <Camera className="h-4 w-4" /> Haz una foto o sube el ticket
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3" /> Rellenamos comercio, NIF, fecha e importe automáticamente
                      </span>
                    </span>
                  )}
                </button>
              )}
            </div>
          )}

          {isMileage && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="claim-origin">Origen</Label>
                  <Input id="claim-origin" value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="Oficina, Gavà" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="claim-destination">Destino</Label>
                  <Input id="claim-destination" value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder="Cliente, Sabadell" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="claim-km">Kilómetros (ida y vuelta)</Label>
                <Input id="claim-km" type="number" inputMode="decimal" min="0.1" step="0.1" value={form.distanceKm} onChange={(e) => set("distanceKm", e.target.value)} required />
              </div>
            </div>
          )}

          {isPerDiem && (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="claim-perdiem-type">Tipo de dieta</Label>
                <Select value={form.perDiemType} onValueChange={(v) => set("perDiemType", v as PerDiemType)}>
                  <SelectTrigger id="claim-perdiem-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PER_DIEM_LABELS) as PerDiemType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {PER_DIEM_LABELS[t]} · {formatCurrency(Number(settings[PER_DIEM_SETTING_KEY[t]]))}/día
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="claim-days">Días</Label>
                <Input id="claim-days" type="number" inputMode="decimal" min="0.5" step="0.5" value={form.perDiemDays} onChange={(e) => set("perDiemDays", e.target.value)} required />
              </div>
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                Exentas de IRPF solo en desplazamientos a otro municipio distinto del lugar de trabajo y de residencia, y hasta 9 meses seguidos en el mismo destino.
              </p>
            </div>
          )}

          {computed && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{computed.detail}</span>
                <span className="font-semibold tabular-nums">{formatCurrency(computed.amount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Exento de IRPF</span>
                <span className="tabular-nums">{formatCurrency(computed.exempt)}</span>
              </div>
              {computed.taxable > 0 && (
                <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400">
                  <span>Tributa como salario en nómina</span>
                  <span className="tabular-nums">{formatCurrency(computed.taxable)}</span>
                </div>
              )}
            </div>
          )}

          {needsReceipt && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="claim-merchant">Comercio / proveedor</Label>
                  <Input id="claim-merchant" value={form.merchant} onChange={(e) => set("merchant", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="claim-nif">NIF del emisor</Label>
                  <Input id="claim-nif" value={form.merchantNif} onChange={(e) => set("merchantNif", e.target.value.toUpperCase())} />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="claim-amount">Importe total (IVA incluido)</Label>
                  <Input id="claim-amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="claim-vat">IVA</Label>
                  <Select value={form.vatRate} onValueChange={(v) => set("vatRate", v)}>
                    <SelectTrigger id="claim-vat"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["0", "4", "10", "21"].map((r) => <SelectItem key={r} value={r}>{r}%</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2.5">
                {num(form.vatRate) > 0 && (
                  <CheckboxRow
                    id="claim-vat-deductible"
                    checked={form.vatDeductible}
                    onChange={(v) => set("vatDeductible", v)}
                    label="Factura completa a nombre de la empresa"
                    hint="Con NIF de la empresa: el IVA se deduce en el modelo 303. Un ticket simplificado no permite deducirlo."
                  />
                )}
                <CheckboxRow
                  id="claim-company-card"
                  checked={form.paidWithCompanyCard}
                  onChange={(v) => set("paidWithCompanyCard", v)}
                  label="Pagado con tarjeta de empresa"
                  hint="Se justifica el gasto pero no se reembolsa al empleado."
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="claim-description">Motivo del gasto</Label>
            <Textarea id="claim-description" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Visita a cliente, feria, formación..." />
          </div>

          <div className={cn("grid gap-3", showVehicle ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
            <div className="space-y-1.5">
              <Label htmlFor="claim-project">Proyecto {settings.requireProject ? "" : "(opcional)"}</Label>
              <Select value={form.projectId || NONE} onValueChange={(v) => set("projectId", v === NONE ? "" : v)}>
                <SelectTrigger id="claim-project"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin proyecto</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {showVehicle && (
              <div className="space-y-1.5">
                <Label htmlFor="claim-vehicle">Vehículo (opcional)</Label>
                <Select value={form.vehicleId || NONE} onValueChange={(v) => set("vehicleId", v === NONE ? "" : v)}>
                  <SelectTrigger id="claim-vehicle"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin vehículo</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.matricula}{v.marca ? ` · ${v.marca}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending || !amountValid || (context.canApprove && !form.employeeId && !claim)}>
              {pending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {claim ? "Guardar cambios" : "Guardar gasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
