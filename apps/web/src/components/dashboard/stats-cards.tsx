"use client";

import { useDashboardStats } from "@/hooks/use-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, FileText, Users, Briefcase, Euro } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const ICONS = [Euro, FileText, Users, Briefcase];
const COLORS = [
  { text: "text-emerald-500", bg: "bg-emerald-500/10" },
  { text: "text-amber-500", bg: "bg-amber-500/10" },
  { text: "text-blue-500", bg: "bg-blue-500/10" },
  { text: "text-purple-500", bg: "bg-purple-500/10" },
];

export function StatsCards() {
  const { data, isLoading } = useDashboardStats();
  const t = useTranslations("dashboard");

  const labelKeys = ["revenue", "invoices", "clients", "deals"] as const;

  const stats: { label: string; value: string; change: number; extra?: string }[] = data
    ? [
        {
          label: t(`stats.revenue`),
          value: formatCurrency(data.totalRevenue),
          change: data.revenueChange,
        },
        {
          label: t(`stats.invoices`),
          value: `${data.pendingInvoices}`,
          change: 0,
          extra: formatCurrency(data.pendingAmount),
        },
        {
          label: t(`stats.clients`),
          value: `${data.activeClients}`,
          change: data.clientsChange,
        },
        {
          label: t(`stats.deals`),
          value: `${data.openDeals}`,
          change: 0,
          extra: formatCurrency(data.openDealsValue),
        },
      ]
    : Array.from({ length: 4 }, (_, i) => ({
        label: t(`stats.${labelKeys[i]}`),
        value: "—",
        change: 0,
      }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = ICONS[i]!;
        const color = COLORS[i]!;
        const isPositive = stat.change >= 0;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {stat.label}
                    </p>
                    {isLoading ? (
                      <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                    ) : (
                      <p className="text-2xl font-bold">{stat.value}</p>
                    )}
                    {stat.extra && !isLoading && (
                      <p className="text-xs text-muted-foreground">{stat.extra}</p>
                    )}
                  </div>
                  <div className={cn("rounded-lg p-2.5", color.bg)}>
                    <Icon className={cn("h-5 w-5", color.text)} />
                  </div>
                </div>
                {stat.change !== 0 && (
                  <div className="mt-3 flex items-center gap-1">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={cn("text-xs font-medium", isPositive ? "text-emerald-500" : "text-red-500")}>
                      {isPositive ? "+" : ""}{stat.change}%
                    </span>
                    <span className="text-xs text-muted-foreground">{t("stats.vsLastMonth")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
