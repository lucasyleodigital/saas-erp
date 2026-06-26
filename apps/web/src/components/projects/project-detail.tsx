"use client";

import { useProject, useProjectProfitability, useDeleteProject } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Trash2,
  DollarSign,
  Clock,
  PieChart,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/use-locale";
import { useTranslations } from "next-intl";

const STATUS_BADGE_VARIANTS: Record<string, "success" | "warning" | "info" | "destructive"> = {
  ACTIVE: "success",
  ON_HOLD: "warning",
  COMPLETED: "info",
  CANCELLED: "destructive",
};

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");

  const STATUS_BADGE_LABELS: Record<string, string> = {
    ACTIVE: t("statusActive"),
    ON_HOLD: t("statusOnHold"),
    COMPLETED: t("statusCompleted"),
    CANCELLED: t("statusCancelled"),
  };

  const { data: project, isLoading, isError } = useProject(id);
  const { data: profitability } = useProjectProfitability(id);
  const deleteProject = useDeleteProject();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="font-medium text-destructive">{t("errorLoadingDetail")}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const sbVariant = STATUS_BADGE_VARIANTS[project.status] ?? STATUS_BADGE_VARIANTS.ACTIVE;
  const sbLabel = STATUS_BADGE_LABELS[project.status] ?? STATUS_BADGE_LABELS.ACTIVE;
  const budget = Number(project.budget) || 0;
  const revenue = Number(profitability?.revenue ?? project.revenue ?? 0);
  const hours = Number(profitability?.totalHours ?? project.totalHours ?? 0);
  const budgetUsedPct = Number(profitability?.budgetUsedPercent ?? (budget > 0 ? ((Number(project.budgetUsed ?? project.spent ?? 0) / budget) * 100) : 0));
  const margin = Number(profitability?.profitMargin ?? 0);
  const timeEntries = project.timeEntries ?? profitability?.timeEntries ?? [];
  const invoices = project.invoices ?? profitability?.invoices ?? [];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {project.color && (
              <div
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: project.color }}
              />
            )}
            <h1 className="text-2xl font-bold truncate">{project.name}</h1>
            <Badge variant={sbVariant}>{sbLabel}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {project.client?.name ?? project.clientName ?? t("noClient")}
            {project.startDate && (
              <span className="ml-2">
                {tCommon("from")} {formatDate(project.startDate)}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive gap-2"
          onClick={() => {
            if (confirm(t("confirmDelete", { name: project.name }))) {
              deleteProject.mutate(project.id, {
                onSuccess: () => router.push(`/${locale}/proyectos`),
              });
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          {tCommon("delete")}
        </Button>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground">{project.description}</p>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: t("detail.revenue"),
            value: formatCurrency(revenue),
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
          {
            title: t("detail.hours"),
            value: `${hours.toFixed(1)} h`,
            icon: Clock,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
          },
          {
            title: t("detail.budgetUsed"),
            value: `${budgetUsedPct.toFixed(0)}%`,
            icon: PieChart,
            color: budgetUsedPct > 90 ? "text-destructive" : "text-amber-600",
            bg: budgetUsedPct > 90 ? "bg-destructive/10" : "bg-amber-500/10",
          },
          {
            title: t("detail.margin"),
            value: `${margin.toFixed(1)}%`,
            icon: TrendingUp,
            color: margin >= 0 ? "text-emerald-600" : "text-destructive",
            bg: margin >= 0 ? "bg-emerald-500/10" : "bg-destructive/10",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      kpi.bg
                    )}
                  >
                    <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.title}</p>
                    <p className="text-lg font-semibold">{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Time entries table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("detail.recentTimeEntries")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {timeEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-6">
              {t("detail.noTimeEntries")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{tCommon("date")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("detail.employee")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("detail.clockIn")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("detail.clockOut")}</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">{t("detail.hoursCol")}</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.slice(0, 10).map((te: any) => (
                    <tr
                      key={te.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">{formatDate(te.date)}</td>
                      <td className="px-4 py-3">
                        {te.employee
                          ? `${te.employee.firstName} ${te.employee.lastName}`
                          : "---"}
                      </td>
                      <td className="px-4 py-3">{te.clockIn ? new Date(te.clockIn).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "---"}</td>
                      <td className="px-4 py-3">{te.clockOut ? new Date(te.clockOut).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "---"}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {te.totalMinutes ? (te.totalMinutes / 60).toFixed(1) : "---"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("detail.linkedInvoices")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-6">
              {t("detail.noLinkedInvoices")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("detail.invoiceNumber")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{tCommon("date")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{tCommon("status")}</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">{tCommon("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/facturas/${inv.id}`}
                          className="text-primary hover:underline"
                        >
                          {inv.number ?? inv.invoiceNumber ?? inv.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {inv.date ? formatDate(inv.date) : inv.createdAt ? formatDate(inv.createdAt) : "---"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            inv.status === "PAID"
                              ? "success"
                              : inv.status === "OVERDUE"
                                ? "destructive"
                                : "warning"
                          }
                        >
                          {inv.status === "PAID"
                            ? tCommon("paid")
                            : inv.status === "OVERDUE"
                              ? tCommon("overdue")
                              : inv.status === "DRAFT"
                                ? tCommon("draft")
                                : tCommon("pending")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(Number(inv.total ?? inv.totalAmount ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
