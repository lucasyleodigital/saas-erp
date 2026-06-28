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
  useWeeklyView,
  useMissedClocks,
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
  QrCode,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useGpsConsent, GpsConsentBanner } from "./gps-consent";
import { useUser } from "@/hooks/use-user";

export function TimeTrackingView() {
  const t = useTranslations("timeTracking");
  const tCommon = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState<"list" | "week">("list");
  const [clockEmployee, setClockEmployee] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const { data: currentUser } = useUser();
  const isEmployee = currentUser?.role === "EMPLOYEE";

  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const { data: activeClocks = [] } = useActiveClocks();
  const { data: summaryData } = useTimeSummary();
  const { consented: gpsConsented, accept: acceptGps, reject: rejectGps } = useGpsConsent();

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

  // Employee sees only their own simplified view
  if (isEmployee) {
    return <EmployeeClockView gpsConsented={gpsConsented} acceptGps={acceptGps} rejectGps={rejectGps} />;
  }

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
              api.get("/time-entries/qr-token").then((r) => {
                const url = `${window.location.origin}/es/control-horario?qr=${r.data.token}`;
                navigator.clipboard.writeText(url);
                toast.success("Enlace QR copiado. Genera un codigo QR con este enlace para que tus empleados fichen.");
              }).catch(() => toast.error("Error al generar QR"));
            }}
            className="gap-2"
          >
            <QrCode className="h-4 w-4" /> QR
          </Button>
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

      {/* GPS consent */}
      {gpsConsented === null && (
        <GpsConsentBanner onAccept={acceptGps} onReject={rejectGps} />
      )}

      {/* GPS status indicator */}
      {gpsConsented !== null && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/20 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${gpsConsented ? "text-green-600" : "text-muted-foreground"}`} />
            <span className="text-muted-foreground">
              GPS: {gpsConsented ? "Activado" : "Desactivado"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => {
              if (gpsConsented) {
                rejectGps();
              } else {
                acceptGps();
              }
            }}
          >
            {gpsConsented ? "Desactivar" : "Activar"}
          </Button>
        </div>
      )}

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
                  {c.latitude && <MapPin className="h-3 w-3 opacity-50" />}
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

      {/* Missed clocks warning */}
      <MissedClocksAlert />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        <button onClick={() => setTab("list")} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "list" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          <Clock className="h-3.5 w-3.5" /> Registros
        </button>
        <button onClick={() => setTab("week")} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "week" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          <CalendarDays className="h-3.5 w-3.5" /> Vista semanal
        </button>
      </div>

      {tab === "week" && <WeeklyCalendar />}

      {tab === "list" && <>
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
                    <th className="text-center font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                      GPS
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
                          <td className="px-4 py-3 hidden lg:table-cell text-center">
                            {entry.latitude ? (
                              <a
                                href={`https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                title={`${entry.latitude?.toFixed(4)}, ${entry.longitude?.toFixed(4)}`}
                              >
                                <MapPin className="h-3.5 w-3.5" /> Ver mapa
                              </a>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs">-</span>
                            )}
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
      </>}
    </div>
  );
}

/* ─── Missed Clocks Alert ────────────────────────────────── */

function MissedClocksAlert() {
  const { data: missed = [] } = useMissedClocks();
  if ((missed as any[]).length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Empleados sin fichar hoy
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {(missed as any[]).map((emp: any) => (
                <Badge key={emp.id} variant="secondary" className="text-xs">
                  {emp.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Weekly Calendar ────────────────────────────────────── */

function getEmployeeLocation(allowed: boolean): Promise<{ latitude: number; longitude: number } | null> {
  if (!allowed || typeof window === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 },
    );
  });
}

function EmployeeClockView({ gpsConsented, acceptGps, rejectGps }: { gpsConsented: boolean | null; acceptGps: () => void; rejectGps: () => void }) {
  const [acting, setActing] = useState(false);
  const { data: summaryData } = useTimeSummary();

  async function handleClock(action: "clock-in" | "clock-out") {
    setActing(true);
    try {
      const loc = await getEmployeeLocation(gpsConsented === true);
      await api.post(`/my/${action}`, loc ?? {});
      const gpsMsg = loc ? " (con ubicacion)" : "";
      toast.success((action === "clock-in" ? "Entrada fichada" : "Salida fichada") + gpsMsg);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al fichar");
    }
    setActing(false);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <Timer className="h-5 w-5" /> Fichaje
        </h1>
      </div>

      {gpsConsented === null && (
        <GpsConsentBanner onAccept={acceptGps} onReject={rejectGps} />
      )}

      {gpsConsented !== null && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/20 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${gpsConsented ? "text-green-600" : "text-muted-foreground"}`} />
            <span className="text-muted-foreground">Ubicacion: {gpsConsented ? "Activada" : "Desactivada"}</span>
          </div>
          <button className="text-xs text-primary hover:underline" onClick={() => gpsConsented ? rejectGps() : acceptGps()}>
            {gpsConsented ? "Desactivar" : "Activar"}
          </button>
        </div>
      )}

      <Card className="border-primary/20">
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-4xl font-bold tabular-nums">{timeStr}</p>
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" className="h-14 text-base gap-2" onClick={() => handleClock("clock-in")} disabled={acting}>
              <LogIn className="h-5 w-5" /> Entrada
            </Button>
            <Button size="lg" variant="outline" className="h-14 text-base gap-2" onClick={() => handleClock("clock-out")} disabled={acting}>
              <LogOut className="h-5 w-5" /> Salida
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Hoy", value: summaryData?.today ?? 0, icon: Clock },
          { label: "Semana", value: summaryData?.week ?? 0, icon: CalendarDays },
          { label: "Mes", value: summaryData?.month ?? 0, icon: Timer },
          { label: "Extras", value: summaryData?.overtime ?? 0, icon: Zap },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-3 text-center">
              <kpi.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{kpi.value.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WeeklyCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 + weekOffset * 7);
    return d.toISOString().slice(0, 10);
  })();

  const { data, isLoading } = useWeeklyView(weekStart);
  const days: string[] = data?.days ?? [];
  const rows: any[] = data?.rows ?? [];

  const dayNames = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>Anterior</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Esta semana</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>Siguiente</Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {days[0] ? new Date(days[0]).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : ""} - {days[6] ? new Date(days[6]).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="h-48 bg-muted/40 rounded-xl animate-pulse" />
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Sin empleados activos</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground sticky left-0 bg-muted/30 min-w-[150px]">Empleado</th>
                  {days.map((day, i) => {
                    const isToday = day === new Date().toISOString().slice(0, 10);
                    return (
                      <th key={day} className={`text-center px-3 py-3 font-medium min-w-[80px] ${isToday ? "text-primary bg-primary/5" : "text-muted-foreground"}`}>
                        <div>{dayNames[i]}</div>
                        <div className="text-xs font-normal">{new Date(day).getDate()}</div>
                      </th>
                    );
                  })}
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground min-w-[80px]">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-amber-600 min-w-[80px]">Extra</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={row.employee.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium sticky left-0 bg-background">{row.employee.name}</td>
                    {row.days.map((day: any) => {
                      const isToday = day.date === new Date().toISOString().slice(0, 10);
                      return (
                        <td key={day.date} className={`text-center px-3 py-3 ${isToday ? "bg-primary/5" : ""}`}>
                          {day.hours > 0 ? (
                            <div>
                              <span className={`font-semibold ${day.hours >= 8 ? "text-emerald-600" : "text-amber-600"}`}>{day.hours}h</span>
                              {day.clockIn && <div className="text-xs text-muted-foreground">{day.clockIn}-{day.clockOut ?? "..."}</div>}
                            </div>
                          ) : day.hasOpen ? (
                            <span className="h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse" title="Fichado" />
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-right px-4 py-3 font-bold">{row.weekTotal}h</td>
                    <td className="text-right px-4 py-3 font-bold text-amber-600">{row.overtime > 0 ? `${row.overtime}h` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
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
