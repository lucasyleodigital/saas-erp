"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useExpenseFormat } from "./use-expense-format";
import {
  EXPENSE_CATEGORIES,
  REIMBURSEMENT_METHODS,
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
  { key: "mileageRate", legal: "mileage", step: "0.001" },
  { key: "perDiemEsOvernight", legal: "ES_OVERNIGHT", step: "0.01" },
  { key: "perDiemEsDay", legal: "ES_DAY", step: "0.01" },
  { key: "perDiemAbroadOvernight", legal: "ABROAD_OVERNIGHT", step: "0.01" },
  { key: "perDiemAbroadDay", legal: "ABROAD_DAY", step: "0.01" },
] as const;

export function ExpenseSettingsPanel({ context }: { context: ExpenseContext }) {
  const { t, money, locale } = useExpenseFormat();
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
      EXPENSE_CATEGORIES.map((category) => {
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
          <CardTitle className="text-base">{t("settings.ratesTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("settings.ratesBody")}</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {RATE_FIELDS.map((f) => {
            const legal = legalValue(f.legal);
            const current = Number(rates[f.key] ?? 0);
            return (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`rate-${f.key}`}>{t(`settings.${f.key}`)}</Label>
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
                  {t("settings.exemptUpTo", {
                    value: f.legal === "mileage"
                      ? `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(legal)} €/km`
                      : money(legal),
                  })}
                  {current > legal ? t("settings.excessTaxed") : ""}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">{t("settings.generalTitle")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cfg-method">{t("settings.defaultMethod")}</Label>
            <Select value={defaultMethod} onValueChange={(v) => setDefaultMethod(v as ReimbursementMethod)}>
              <SelectTrigger id="cfg-method"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REIMBURSEMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{t(`methods.${m}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cfg-days">{t("settings.maxDays")}</Label>
            <Input id="cfg-days" type="number" min="1" value={maxDaysOld} onChange={(e) => setMaxDaysOld(e.target.value)} />
          </div>
          <label htmlFor="cfg-project" className="flex items-start gap-2.5 cursor-pointer">
            <input id="cfg-project" type="checkbox" checked={requireProject} onChange={(e) => setRequireProject(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
            <span className="text-sm">{t("settings.requireProject")}
              <span className="block text-xs text-muted-foreground">{t("settings.requireProjectHint")}</span>
            </span>
          </label>
          <label htmlFor="cfg-autopost" className="flex items-start gap-2.5 cursor-pointer">
            <input id="cfg-autopost" type="checkbox" checked={autoPost} onChange={(e) => setAutoPost(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
            <span className="text-sm">{t("settings.autoPost")}
              <span className="block text-xs text-muted-foreground">{t("settings.autoPostHint")}</span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("settings.policyTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("settings.policyBody")}</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 text-left font-medium">{t("settings.colCategory")}</th>
                    <th className="py-2 px-3 text-left font-medium">{t("settings.colMax")}</th>
                    <th className="py-2 px-3 text-center font-medium">{t("settings.colReceipt")}</th>
                    <th className="py-2 pl-3 text-center font-medium">{t("settings.colActive")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const receiptless = RECEIPTLESS_CATEGORIES.includes(r.category);
                    const category = t(`categories.${r.category}`);
                    return (
                      <tr key={r.category} className="border-b last:border-0">
                        <td className="py-2 pr-3">{category}</td>
                        <td className="py-2 px-3">
                          <Input
                            aria-label={t("settings.maxFor", { category })}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={t("settings.noLimit")}
                            className="h-8 w-32"
                            value={r.maxAmount}
                            onChange={(e) => updateRow(r.category, { maxAmount: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {receiptless ? (
                            <span className="text-xs text-muted-foreground">{t("settings.notApplicable")}</span>
                          ) : (
                            <input
                              type="checkbox"
                              aria-label={t("settings.receiptFor", { category })}
                              checked={r.requiresReceipt}
                              onChange={(e) => updateRow(r.category, { requiresReceipt: e.target.checked })}
                              className="h-4 w-4 accent-primary"
                            />
                          )}
                        </td>
                        <td className="py-2 pl-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={t("settings.activeFor", { category })}
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
          {t("settings.save")}
        </Button>
      </div>
    </div>
  );
}
