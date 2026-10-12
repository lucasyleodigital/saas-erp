"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useExpenseAnalytics } from "@/hooks/use-expense-claims";
import { useExpenseFormat } from "./use-expense-format";

type Range = "12m" | "ytd" | "3m";

function rangeParams(range: Range) {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (range === "ytd") return { from: `${now.getFullYear()}-01-01`, to };
  const months = range === "3m" ? 2 : 11;
  const from = new Date(Date.UTC(now.getFullYear(), now.getMonth() - months, 1)).toISOString().slice(0, 10);
  return { from, to };
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function BarList({ title, rows, empty }: {
  title: string;
  rows: { key: string; label: string; amount: number; count: number; color?: string | null }[];
  empty: string;
}) {
  const { t, money } = useExpenseFormat();
  const max = Math.max(1, ...rows.map((r) => r.amount));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{empty}</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((r) => (
              <li key={r.key} className="space-y-1">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{r.label}</span>
                  <span className="tabular-nums font-medium shrink-0">{money(r.amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(r.amount / max) * 100}%`, ...(r.color ? { background: r.color } : {}) }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{t("analytics.count", { count: r.count })}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ExpenseAnalytics() {
  const { t, money, locale } = useExpenseFormat();
  const [range, setRange] = useState<Range>("12m");
  const params = useMemo(() => rangeParams(range), [range]);
  const { data, isLoading } = useExpenseAnalytics(params);

  if (isLoading || !data) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const k = data.totals;
  const chart = data.byMonth.map((m) => ({
    name: new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString(locale, { month: "short", year: "2-digit", timeZone: "UTC" }),
    amount: m.amount,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("analytics.intro")}</p>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-48" aria-label={t("analytics.period")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">{t("analytics.last3")}</SelectItem>
            <SelectItem value="12m">{t("analytics.last12")}</SelectItem>
            <SelectItem value="ytd">{t("analytics.ytd")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label={t("analytics.approved")} value={money(k.approved)} sub={t("analytics.approvedSub", { claims: k.claims, employees: k.employees })} />
        <Kpi label={t("analytics.pendingApproval")} value={money(k.pendingApproval)} sub={t("analytics.pendingApprovalSub", { count: k.pendingApprovalCount })} />
        <Kpi label={t("analytics.pendingReimbursement")} value={money(k.pendingReimbursement)} sub={t("analytics.pendingReimbursementSub", { count: k.pendingReimbursementCount })} />
        <Kpi label={t("analytics.vatRecoverable")} value={money(k.vatRecoverable)} sub={t("analytics.vatRecoverableSub")} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{t("analytics.monthly")}</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
                />
                <Tooltip
                  formatter={(v: number) => [money(v), t("analytics.tooltip")]}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarList
          title={t("analytics.byCategory")}
          rows={data.byCategory.map((r) => ({ key: r.category, label: t(`categories.${r.category}`), amount: r.amount, count: r.count }))}
          empty={t("analytics.emptyPeriod")}
        />
        <BarList
          title={t("analytics.byEmployee")}
          rows={data.byEmployee.map((r) => ({ key: r.employeeId, label: r.label, amount: r.amount, count: r.count }))}
          empty={t("analytics.emptyPeriod")}
        />
        <BarList
          title={t("analytics.byProject")}
          rows={data.byProject.map((r) => ({ key: r.projectId, label: r.label, amount: r.amount, count: r.count, color: r.color }))}
          empty={t("analytics.emptyProject")}
        />
        <BarList
          title={t("analytics.byVehicle")}
          rows={data.byVehicle.map((r) => ({ key: r.vehicleId, label: r.label, amount: r.amount, count: r.count }))}
          empty={t("analytics.emptyVehicle")}
        />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{t("analytics.policyTitle")}</CardTitle></CardHeader>
        <CardContent>
          {data.warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("analytics.policyOk")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.warnings.map((w) => (
                <span key={w.code} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                  {t.has(`warnings.${w.code}`) ? t(`warnings.${w.code}`) : w.code}
                  <span className="tabular-nums font-semibold">{w.count}</span>
                </span>
              ))}
              <span className="text-xs text-muted-foreground self-center">
                {t("analytics.policySummary", { with: k.withWarnings, total: k.claims })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
