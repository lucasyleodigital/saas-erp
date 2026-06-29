"use client";

import { useState } from "react";
import {
  useEmployees,
  useEmployeeStats,
  useDeleteEmployee,
  useLeaveRequests,
  useApproveLeave,
  useRejectLeave,
} from "@/hooks/use-employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Search,
  Plus,
  MoreHorizontal,
  Users,
  Briefcase,
  TrendingUp,
  CalendarOff,
  Eye,
  Trash2,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { motion } from "framer-motion";
import { EmployeeDialog } from "./employee-dialog";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { useTranslations } from "next-intl";

const STATUS_TAB_KEYS = [
  { key: undefined,   tKey: "all" as const },
  { key: "ACTIVE",    tKey: "active" as const },
  { key: "ON_LEAVE",  tKey: "onLeave" as const },
  { key: "INACTIVE",  tKey: "inactive" as const },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  INACTIVE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ON_LEAVE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const CONTRACT_KEYS: Record<string, string> = {
  INDEFINIDO:    "indefinido",
  TEMPORAL:      "temporal",
  PRACTICAS:     "practicas",
  AUTONOMO:      "autonomo",
  OBRA_SERVICIO: "obraServicio",
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function EmployeesView() {
  const t = useTranslations("employees");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: stats } = useEmployeeStats();
  const deleteEmployee = useDeleteEmployee();

  const { data, isLoading } = useEmployees({
    search: debouncedSearch || undefined,
    status,
    page,
    limit: 20,
  });

  const employees = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">{t("active")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <CalendarOff className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.pendingLeaves}</p>
                <p className="text-xs text-muted-foreground">{t("pendingLeaves")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(stats.monthlySalaryCost)}</p>
                <p className="text-xs text-muted-foreground">{t("monthlyCost")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Briefcase className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(stats.annualSalaryCost)}</p>
                <p className="text-xs text-muted-foreground">{t("annualCost")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto">
          {STATUS_TAB_KEYS.map((tab) => (
            <button
              key={tab.tKey}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
                status === tab.key
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(tab.tKey)}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">{t("noResults")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("noResultsDesc")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("table.employee")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">{t("table.position")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">{t("table.contract")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">{t("table.startDate")}</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">{t("table.annualSalary")}</th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-3">{t("table.status")}</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => {
                    const statusColor = STATUS_COLORS[emp.status] ?? STATUS_COLORS.ACTIVE;
                    const statusTKey = emp.status === "ACTIVE" ? "active" : emp.status === "INACTIVE" ? "inactive" : "onLeave";
                    return (
                      <motion.tr
                        key={emp.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {getInitials(emp.firstName, emp.lastName)}
                            </div>
                            <div>
                              <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                              {emp.email && <p className="text-xs text-muted-foreground">{emp.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          <div>
                            <p>{emp.position ?? "—"}</p>
                            {emp.department && <p className="text-xs text-muted-foreground">{emp.department}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {CONTRACT_KEYS[emp.contractType] ? t(`contracts.${CONTRACT_KEYS[emp.contractType]}`) : emp.contractType}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {formatDate(emp.startDate)}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-right font-medium">
                          {formatCurrency(Number(emp.salary))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusColor)}>
                            {t(`statuses.${statusTKey}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/empleados/${emp.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t("table.viewProfile")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (confirm(t("table.confirmDelete", { name: `${emp.firstName} ${emp.lastName}` })))
                                    deleteEmployee.mutate(emp.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("table.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("table.page", { page, totalPages })}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("pagination.previous")}</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t("pagination.next")}</Button>
          </div>
        </div>
      )}

      <PendingLeaveRequests />

      <EmployeeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function PendingLeaveRequests() {
  const t = useTranslations("employees");
  const { data } = useLeaveRequests({ status: "PENDING" });
  const approve = useApproveLeave();
  const reject = useRejectLeave();

  const requests = data ?? [];
  if (requests.length === 0) return null;

  const LEAVE_TYPE_KEYS: Record<string, string> = {
    VACATION: "vacation",
    SICK: "sick",
    PERSONAL: "personal",
    MATERNITY: "maternity",
    OTHER: "other",
  };

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          {t("leaveRequests.title", { count: requests.length })}
        </h3>
        <div className="space-y-3">
          {requests.map((req: any) => (
            <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
              <div>
                <p className="text-sm font-medium">
                  {req.employee?.firstName ?? ""} {req.employee?.lastName ?? ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {LEAVE_TYPE_KEYS[req.type] ? t(`leaveRequests.${LEAVE_TYPE_KEYS[req.type]}`) : req.type} · {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()} · {t("leaveRequests.days", { days: req.days })}
                </p>
                {req.reason && <p className="text-xs text-muted-foreground mt-0.5">{t("leaveRequests.reason", { reason: req.reason })}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50 gap-1 h-8"
                  onClick={() => approve.mutate(req.id)}
                  disabled={approve.isPending}
                >
                  {t("leaveRequests.approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 gap-1 h-8"
                  onClick={() => reject.mutate(req.id)}
                  disabled={reject.isPending}
                >
                  {t("leaveRequests.reject")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
