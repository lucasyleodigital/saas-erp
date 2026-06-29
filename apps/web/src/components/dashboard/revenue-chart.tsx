"use client";

import { useRevenueChart } from "@/hooks/use-dashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";

// Static fallback while loading or no data
const PLACEHOLDER = [
  { month: "Ene", revenue: 0, expenses: 0 },
  { month: "Feb", revenue: 0, expenses: 0 },
  { month: "Mar", revenue: 0, expenses: 0 },
  { month: "Abr", revenue: 0, expenses: 0 },
  { month: "May", revenue: 0, expenses: 0 },
  { month: "Jun", revenue: 0, expenses: 0 },
];

export function RevenueChart() {
  const t = useTranslations("dashboard.revenueChart");
  const { data, isLoading } = useRevenueChart();
  const chartData = data?.length ? data : PLACEHOLDER;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t("revenue")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              {t("expenses")}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(239 84% 67%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(239 84% 67%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215 20% 65%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(215 20% 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-border bg-popover p-3 shadow-md">
                      <p className="font-medium text-sm mb-2">{label}</p>
                      {payload.map((p) => (
                        <div key={p.name} className="flex items-center justify-between gap-6 text-xs">
                          <span className="text-muted-foreground">
                            {p.name === "revenue" ? t("revenue") : t("expenses")}
                          </span>
                          <span className="font-medium">{formatCurrency(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(239 84% 67%)" strokeWidth={2} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="expenses" stroke="hsl(215 20% 65%)" strokeWidth={2} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
