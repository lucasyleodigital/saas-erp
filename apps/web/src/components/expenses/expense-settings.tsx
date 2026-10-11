"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  CATEGORY_LABELS,
  METHOD_LABELS,
  RECEIPTLESS_CATEGORIES,
  useExpensePolicies,
  useSaveExpenseConfig,
  type ExpenseCategory,
  type ExpenseContext,
  type ReimbursementMethod,
} from "@/hooks/use-expense-claims";

interface PolicyRow {
  category: ExpenseCategory;
  maxAmount: string;
  requiresReceipt: boolean;
  isActive: boolean;
}

const RATE_FIELDS = [
  { key: "mileageRate", label: "Kilometraje (€/km)", legal: "mileage", step: "0.001" },
  { key: "perDiemEsOvernight", label: "Dieta España con pernocta (€/día)", legal: "ES_OVERNIGHT", step: "0.01" },
  { key: "perDiemEsDay", label: "Dieta España sin pernocta (€/día)", legal: "ES_DAY", step: "0.01" },
  { key: "perDiemAbroadOvernight", label: "Dieta extranjero con pernocta (€/día)", legal: "ABROAD_OVERNIGHT", step: "0.01" },
  { key: "perDiemAbroadDay", label: "Dieta extranjero sin pernocta (€/día)", legal: "ABROAD_DAY", step: "0.01" },
] as const;

export function ExpenseSettingsPanel({ context }: { context: ExpenseContext }) {
  const { data: policies, isLoading } = useExpensePolicies();
  const save = useSaveExpenseConfig();

  const [rates, setRates] = useState<Record<string, string>>({});
  const [maxDaysOld, setMaxDaysOld] = useState("90");
  const [requireProject, setRequireProject] = useState(false);
  const [autoPost, setAutoPost] = useState(true);
  const [defaultMethod, setDefaultMethod] = useState<ReimbursementMethod>("PAYROLL");
  const [rows, setRows] = useState<PolicyRow[]>([]);

  useEffect(() => {
    const s = context.settings;
    setRates(Object.fromEntries(RATE_FIELDS.map((f) => [f.key, String(Number(s[f.key]))])));
    setMaxDaysOld(String(s.maxDaysOld));
    setRequireProject(s.requireProject);
    setAutoPost(s.autoPostAccounting);
    setDefaultMethod(s.defaultReimbursement);
  }, [context.settings]);

  useEffect(() => {
    if (!policies) return;
    setRows(
      (Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((category) => {
        const p = policies.find((x) => x.category === category);
        return {
          category,
          maxAmount: p?.maxAmount != null ? String(Number(p.maxAmount)) : "",
          requiresReceipt: p ? p.requiresReceipt : !RECEIPTLESS_CATEGORIES.includes(category),
          isActive: p ? p.isActive : true,
        };
      }),
    );
  }, [policies]);

  const legalValue = (legal: string) =>
    legal === "mileage" ? context.legal.mileageRate : context.legal.perDiem[legal as keyof typeof context.legal.perDiem];

  function updateRow(category: ExpenseCategory, patch: Partial<PolicyRow>) {
    setRows((cur) => cur.map((r) => (r.category === category ? { ...r, ...patch } : r)));
  }

  function submit() {
    save.mutate({
      settings: {
        ...Object.fromEntries(Object.entries(rates).map(([k, v]) => [k, v])),
        maxDaysOld: Number(maxDaysOld),
        requireProject,
        autoPostAccounting: autoPost,
        defaultReimbursement: defaultMethod,
      } as any,
      policies: rows.map((r) => ({
        category: r.category,
        maxAmount: r.maxAmount === "" ? null : r.maxAmount,
        requiresReceipt: r.requiresReceipt,
        isActive: r.isActive,
      })) as any,
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tarifas de la empresa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lo que pagas por encima del límite legal exento tributa como salario y se lleva a la nómina automáticamente.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {RATE_FIELDS.map((f) => {
            const legal = legalValue(f.legal);
            const current = Number(rates[f.key] ?? 0);
            return (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`rate-${f.key}`}>{f.label}</Label>
                <Input
                  id={`rate-${f.key}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step={f.step}
                  value={rates[f.key] ?? ""}
                  onChange={(e) => setRates((r) => ({ ...r, [f.key]: e.target.value }))}
                />
                <p className={current > legal ? "text-xs text-amber-600 dark:text-amber-400" : "text-xs text-muted-foreground"}>
                  Exento hasta {f.legal === "mileage" ? `${legal.toFixed(2).replace(".", ",")} €/km` : formatCurrency(legal)}
                  {current > legal ? " · el exceso tributa" : ""}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Reglas generales</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cfg-method">Reembolso por defecto al aprobar</Label>
            <Select value={defaultMethod} onValueChange={(v) => setDefaultMethod(v as ReimbursementMethod)}>
              <SelectTrigger id="cfg-method"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(METHOD_LABELS) as ReimbursementMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cfg-days">Avisar si el gasto tiene más de (días)</Label>
            <Input id="cfg-days" type="number" min="1" value={maxDaysOld} onChange={(e) => setMaxDaysOld(e.target.value)} />
          </div>
          <label htmlFor="cfg-project" className="flex items-start gap-2.5 cursor-pointer">
            <input id="cfg-project" type="checkbox" checked={requireProject} onChange={(e) => setRequireProject(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
            <span className="text-sm">Exigir proyecto en cada gasto
              <span className="block text-xs text-muted-foreground">Los gastos sin proyecto se marcan con aviso.</span>
            </span>
          </label>
          <label htmlFor="cfg-autopost" className="flex items-start gap-2.5 cursor-pointer">
            <input id="cfg-autopost" type="checkbox" checked={autoPost} onChange={(e) => setAutoPost(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
            <span className="text-sm">Contabilizar al aprobar
              <span className="block text-xs text-muted-foreground">Crea el gasto deducible (303/130) y el asiento contra la 465.</span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Política por categoría</CardTitle>
          <p className="text-sm text-muted-foreground">Los gastos que no cumplen se marcan para que quien aprueba los revise.</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 text-left font-medium">Categoría</th>
                    <th className="py-2 px-3 text-left font-medium">Máximo por gasto</th>
                    <th className="py-2 px-3 text-center font-medium">Exige ticket</th>
                    <th className="py-2 pl-3 text-center font-medium">Activa</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const receiptless = RECEIPTLESS_CATEGORIES.includes(r.category);
                    return (
                      <tr key={r.category} className="border-b last:border-0">
                        <td className="py-2 pr-3">{CATEGORY_LABELS[r.category]}</td>
                        <td className="py-2 px-3">
                          <Input
                            aria-label={`Máximo para ${CATEGORY_LABELS[r.category]}`}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Sin límite"
                            className="h-8 w-32"
                            value={r.maxAmount}
                            onChange={(e) => updateRow(r.category, { maxAmount: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {receiptless ? (
                            <span className="text-xs text-muted-foreground">No aplica</span>
                          ) : (
                            <input
                              type="checkbox"
                              aria-label={`Exigir ticket en ${CATEGORY_LABELS[r.category]}`}
                              checked={r.requiresReceipt}
                              onChange={(e) => updateRow(r.category, { requiresReceipt: e.target.checked })}
                              className="h-4 w-4 accent-primary"
                            />
                          )}
                        </td>
                        <td className="py-2 pl-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Política activa en ${CATEGORY_LABELS[r.category]}`}
                            checked={r.isActive}
                            onChange={(e) => updateRow(r.category, { isActive: e.target.checked })}
                            className="h-4 w-4 accent-primary"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Guardar configuración
        </Button>
      </div>
    </div>
  );
}
