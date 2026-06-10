"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, FileText, Users, Briefcase, Euro } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

const stats = [
  {
    label: "Ingresos del mes",
    value: 24850,
    change: 12.5,
    prefix: "€",
    icon: Euro,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Facturas pendientes",
    value: 8,
    change: -2,
    suffix: " facturas",
    extra: "3.200 €",
    icon: FileText,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    label: "Clientes activos",
    value: 47,
    change: 5.3,
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "Deals abiertos",
    value: 14,
    change: 8.1,
    extra: "68.500 €",
    icon: Briefcase,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const isPositive = stat.change > 0;
        const Icon = stat.icon;

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
                    <p className="text-2xl font-bold">
                      {stat.prefix}
                      {typeof stat.value === "number" && !stat.prefix
                        ? stat.value.toLocaleString("es-ES")
                        : stat.prefix === "€"
                        ? formatCurrency(stat.value).replace("€", "").trim()
                        : stat.value}
                      {stat.suffix}
                    </p>
                    {stat.extra && (
                      <p className="text-xs text-muted-foreground">{stat.extra}</p>
                    )}
                  </div>
                  <div className={cn("rounded-lg p-2.5", stat.bg)}>
                    <Icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isPositive ? "text-emerald-500" : "text-red-500"
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {stat.change}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs mes anterior</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
