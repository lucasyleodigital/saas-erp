"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useExpenseAnalytics, WARNING_LABELS } from "@/hooks/use-expense-claims";

type Range = "12m" | "ytd" | "3m";

function rangeParams(range: Range) {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (range === "ytd") return { from: `${now.getFullYear()}-01-01`, to };
  const months = range === "3m" ? 2 : 11;
  const from = new Date(Date.UTC(now.getFullYear(), now.getMonth() - months, 1)).toISOString().slice(0, 10);
  return { from, to };
}

const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

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
                  <span className="tabular-nums font-medium shrink-0">{formatCurrency(r.amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(r.amount / max) * 100}%`, ...(r.color ? { background: r.color } : {}) }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{r.count} gasto(s)</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ExpenseAnalytics() {
  const [range, setRange] = useState<Range>("12m");
  const params = useMemo(() => rangeParams(range), [range]);
  const { data, isLoading } = useExpenseAnalytics(params);

  if (isLoading || !data) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const t = data.totals;
  const chart = data.byMonth.map((m) => ({
    name: `${MONTH_SHORT[Number(m.month.slice(5, 7)) - 1]} ${m.month.slice(2, 4)}`,
    amount: m.amount,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Gastos aprobados y reembolsados por fecha del gasto.</p>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-48" aria-label="Periodo"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="12m">Últimos 12 meses</SelectItem>
            <SelectItem value="ytd">Este año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Gasto aprobado" value={formatCurrency(t.approved)} sub={`${t.claims} gastos · ${t.employees} empleado(s)`} />
        <Kpi label="Pendiente de aprobar" value={formatCurrency(t.pendingApproval)} sub={`${t.pendingApprovalCount} gasto(s)`} />
        <Kpi label="Pendiente de reembolsar" value={formatCurrency(t.pendingReimbursement)} sub={`${t.pendingReimbursementCount} nota(s)`} />
        <Kpi label="IVA recuperable" value={formatCurrency(t.vatRecoverable)} sub="Va al modelo 303" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Evolución mensual</CardTitle></CardHeader>
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
                  formatter={(v: number) => [formatCurrency(v), "Gasto"]}
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
          title="Por categoría"
          rows={data.byCategory.map((r) => ({ key: r.category, label: r.label, amount: r.amount, count: r.count }))}
          empty="Sin gastos aprobados en el periodo."
        />
        <BarList
          title="Por empleado"
          rows={data.byEmployee.map((r) => ({ key: r.employeeId, label: r.label, amount: r.amount, count: r.count }))}
          empty="Sin gastos aprobados en el periodo."
        />
        <BarList
          title="Por proyecto"
          rows={data.byProject.map((r) => ({ key: r.projectId, label: r.label, amount: r.amount, count: r.count, color: r.color }))}
          empty="Ningún gasto imputado a proyectos."
        />
        <BarList
          title="Por vehículo"
          rows={data.byVehicle.map((r) => ({ key: r.vehicleId, label: r.label, amount: r.amount, count: r.count }))}
          empty="Ningún gasto asociado a vehículos de la flota."
        />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Avisos de política en gastos aprobados</CardTitle></CardHeader>
        <CardContent>
          {data.warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todos los gastos aprobados cumplen la política.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.warnings.map((w) => (
                <span key={w.code} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                  {WARNING_LABELS[w.code] ?? w.code}
                  <span className="tabular-nums font-semibold">{w.count}</span>
                </span>
              ))}
              <span className="text-xs text-muted-foreground self-center">
                {t.withWarnings} de {t.claims} gastos aprobados tenían algún aviso
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
