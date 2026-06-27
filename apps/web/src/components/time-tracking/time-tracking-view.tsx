"use client";

import { useState } from "react";
import {
  useTimeEntries,
  useCreateTimeEntry,
  useDeleteTimeEntry,
  useClockIn,
  useClockOut,
  useActiveClocks,
  useTimeSummary,
} from "@/hooks/use-time-tracking";
import { useEmployees } from "@/hooks/use-employees";
import { useProjects } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  Timer,
  Clock,
  CalendarDays,
  Trash2,
  AlertCircle,
  LogIn,
  LogOut,
  Download,
  Zap,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

export function TimeTrackingView() {
  const t = useTranslations("timeTracking");
  const tCommon = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clockEmployee, setClockEmployee] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const { data: activeClocks = [] } = useActiveClocks();
  const { data: summaryData } = useTimeSummary();

  const params: Record<string, any> = {};
  if (filterEmployee) params.employeeId = filterEmployee;
  if (filterProject) params.projectId = filterProject;
  if (filterFrom) params.from = filterFrom;
  if (filterTo) params.to = filterTo;

  const { data, isLoading, isError } = useTimeEntries(params);
  const deleteEntry = useDeleteTimeEntry();

  const entries = data?.data ?? data?.entries ?? (Array.isArray(data) ? data : []);
  const summary = data?.summary ?? {};

  // Compute summary hours
  const todayHours = Number(summary.todayHours ?? summary.today ?? 0);
  const weekHours = Number(summary.weekHours ?? summary.week ?? 0);
  const monthHours = Number(summary.monthHours ?? summary.month ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Timer className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const now = new Date();
              const url = `/time-entries/report?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
              api.get(url).then((r) => {
                const rows = r.data?.rows ?? [];
                if (!rows.length) { toast.error("Sin datos para exportar"); return; }
                const csv = ["Empleado,NIF,Fecha,Entrada,Salida,Pausa (min),Total (h),Horas extra (min),Proyecto"]
                  .concat(rows.map((r: any) => `${r.employee},${r.nif},${r.date},${r.clockIn},${r.clockOut},${r.breakMinutes},${r.totalHours},${r.overtimeMinutes},${r.project}`))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `control-horario-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;
                a.click();
              }).catch(() => toast.error("Error al exportar"));
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Exportar mes
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("new")}
          </Button>
        </div>
      </div>

      {/* Quick clock in/out */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <EmployeeFilter value={clockEmployee} onChange={setClockEmployee} />
            </div>
            <div className="flex gap-2">
              <Button
                className="gap-2"
                onClick={() => { if (clockEmployee) clockIn.mutate({ employeeId: clockEmployee }); }}
                disabled={!clockEmployee || clockIn.isPending}
              >
                <LogIn className="h-4 w-4" /> Fichar entrada
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => { if (clockEmployee) clockOut.mutate({ employeeId: clockEmployee }); }}
                disabled={!clockEmployee || clockOut.isPending}
              >
                <LogOut className="h-4 w-4" /> Fichar salida
              </Button>
            </div>
          </div>
          {(activeClocks as any[]).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(activeClocks as any[]).map((c: any) => (
                <Badge key={c.id} variant="success" className="gap-1.5 py-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  {c.employee?.firstName} {c.employee?.lastName}
                  <span className="text-xs opacity-70">
                    desde {new Date(c.clockIn).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Hoy", value: summaryData?.today ?? todayHours, icon: Clock, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Semana", value: summaryData?.week ?? weekHours, icon: CalendarDays, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Mes", value: summaryData?.month ?? monthHours, icon: Timer, color: "text-purple-600", bg: "bg-purple-500/10" },
          { label: "Horas extra", value: summaryData?.overtime ?? 0, icon: Zap, color: "text-amber-600", bg: "bg-amber-500/10" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-semibold">{s.value.toFixed(1)} h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <EmployeeFilter value={filterEmployee} onChange={setFilterEmployee} />
        <ProjectFilter value={filterProject} onChange={setFilterProject} />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="w-40"
            placeholder="Desde"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="w-40"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="font-medium text-destructive">
                {t("loadError")}
              </p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Timer className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">{t("noResults")}</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {t("noResultsDesc")}
              </p>
              <Button onClick={() => setDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t("new")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      {tCommon("date")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      {t("table.employee")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                      {t("table.project")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      {t("table.clockIn")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      {t("table.clockOut")}
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">
                      {tCommon("total")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                      {tCommon("notes")}
                    </th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {entries.map((entry: any, i: number) => {
                      const totalH = entry.totalMinutes
                        ? (entry.totalMinutes / 60).toFixed(1)
                        : "---";
                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            {formatDate(entry.date)}
                          </td>
                          <td className="px-4 py-3">
                            {entry.employee
                              ? `${entry.employee.firstName} ${entry.employee.lastName}`
                              : entry.employeeName ?? "---"}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {entry.project?.name ?? entry.projectName ?? (
                              <span className="text-muted-foreground">---</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {entry.clockIn
                              ? new Date(entry.clockIn).toLocaleTimeString(
                                  "es-ES",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : "---"}
                          </td>
                          <td className="px-4 py-3">
                            {entry.clockOut
                              ? new Date(entry.clockOut).toLocaleTimeString(
                                  "es-ES",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : (
                                <Badge variant="success">{t("inProgress")}</Badge>
                              )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {totalH} h
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground truncate max-w-[200px]">
                            {entry.notes ?? "---"}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm(t("confirmDelete"))) {
                                  deleteEntry.mutate(entry.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New entry dialog */}
      <NewTimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

/* ─── Filter helpers ─────────────────────────────────────── */

function EmployeeFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations("timeTracking");
  const { data } = useEmployees({ limit: 200 });
  const employees = data?.data ?? [];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={t("filter.allEmployees")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t("filter.allEmployees")}</SelectItem>
        {employees.map((emp: any) => (
          <SelectItem key={emp.id} value={emp.id}>
            {emp.firstName} {emp.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProjectFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations("timeTracking");
  const { data } = useProjects({ limit: 200 });
  const projects = data?.data ?? (Array.isArray(data) ? data : []);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={t("filter.allProjects")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t("filter.allProjects")}</SelectItem>
        {(Array.isArray(projects) ? projects : []).map((p: any) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ─── New entry dialog ─────────────────────────────────────── */

function NewTimeEntryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations("timeTracking");
  const tCommon = useTranslations("common");

  const [form, setForm] = useState({
    employeeId: "",
    projectId: "",
    date: new Date().toISOString().split("T")[0],
    clockIn: "09:00",
    clockOut: "17:00",
    breakMinutes: "0",
    notes: "",
  });

  const createEntry = useCreateTimeEntry();
  const { data: empData } = useEmployees({ limit: 200 });
  const { data: projData } = useProjects({ limit: 200 });

  const employees = empData?.data ?? [];
  const projects = projData?.data ?? (Array.isArray(projData) ? projData : []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createEntry.mutate(
      {
        employeeId: form.employeeId,
        projectId: form.projectId || undefined,
        date: form.date,
        clockIn: `${form.date}T${form.clockIn}:00`,
        clockOut: `${form.date}T${form.clockOut}:00`,
        breakMinutes: Number(form.breakMinutes) || 0,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({
            employeeId: "",
            projectId: "",
            date: new Date().toISOString().split("T")[0],
            clockIn: "09:00",
            clockOut: "17:00",
            breakMinutes: "0",
            notes: "",
          });
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("dialog.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("dialog.employee")}</Label>
            <Select
              value={form.employeeId}
              onValueChange={(v) => update("employeeId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("dialog.selectEmployee")} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("dialog.project")}</Label>
            <Select
              value={form.projectId}
              onValueChange={(v) => update("projectId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("dialog.noProject")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">{t("dialog.noProject")}</SelectItem>
                {(Array.isArray(projects) ? projects : []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="te-date">{t("dialog.date")}</Label>
            <Input
              id="te-date"
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="te-in">{t("dialog.clockIn")}</Label>
              <Input
                id="te-in"
                type="time"
                value={form.clockIn}
                onChange={(e) => update("clockIn", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="te-out">{t("dialog.clockOut")}</Label>
              <Input
                id="te-out"
                type="time"
                value={form.clockOut}
                onChange={(e) => update("clockOut", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="te-break">{t("dialog.break")}</Label>
            <Input
              id="te-break"
              type="number"
              min="0"
              value={form.breakMinutes}
              onChange={(e) => update("breakMinutes", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="te-notes">{tCommon("notes")}</Label>
            <Input
              id="te-notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder={t("dialog.notesPlaceholder")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!form.employeeId || createEntry.isPending}
            >
              {createEntry.isPending ? t("dialog.submitting") : t("dialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
