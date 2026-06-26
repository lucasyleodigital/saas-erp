"use client";

import { useState } from "react";
import {
  useEmployee,
  useUpdateEmployee,
  useTimeEntries,
  useClockIn,
  useClockOut,
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeave,
  useRejectLeave,
  useDeleteLeaveRequest,
  EMPLOYEE_STATUS_CONFIG,
  CONTRACT_LABELS,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_CONFIG,
} from "@/hooks/use-employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  ArrowLeft,
  User,
  Clock,
  CalendarOff,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronDown,
  Plus,
  Briefcase,
  Phone,
  Mail,
  CreditCard,
} from "lucide-react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";

const TAB_KEYS = ["profile", "schedule", "leaves"] as const;
type Tab = typeof TAB_KEYS[number];

const LOCALE_MAP: Record<string, string> = {
  es: "es-ES", en: "en-US", ca: "ca-ES", eu: "eu-ES", gl: "gl-ES",
};

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function formatMinutes(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function EmployeeDetailView({ id }: { id: string }) {
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = LOCALE_MAP[locale] ?? "es-ES";
  const { data: employee, isLoading } = useEmployee(id);
  const updateEmployee = useUpdateEmployee();
  const clockIn  = useClockIn();
  const clockOut = useClockOut();
  const approveLeave = useApproveLeave();
  const rejectLeave  = useRejectLeave();
  const deleteLeave  = useDeleteLeaveRequest();
  const createLeave  = useCreateLeaveRequest();

  const now = new Date();
  const { data: timeData } = useTimeEntries(id, {
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
  });
  const { data: leaveData } = useLeaveRequests({ employeeId: id });

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [leaveForm, setLeaveForm] = useState({ type: "VACATION", startDate: "", endDate: "", reason: "" });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!employee) return <div className="text-center py-20 text-muted-foreground">{t("detail.notFound")}</div>;

  const statusCfg = EMPLOYEE_STATUS_CONFIG[employee.status] ?? EMPLOYEE_STATUS_CONFIG.ACTIVE;
  const entries = timeData?.entries ?? [];
  const leaves  = leaveData ?? [];
  const openEntry = entries.find((e) => !e.clockOut);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/empleados"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
              {getInitials(employee.firstName, employee.lastName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{employee.firstName} {employee.lastName}</h1>
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusCfg!.color)}>
                  {statusCfg!.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{employee.position ?? t("detail.noPosition")}{employee.department ? ` · ${employee.department}` : ""}</p>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              {tCommon("status")} <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["ACTIVE", "ON_LEAVE", "INACTIVE"].map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => updateEmployee.mutate({ id, status: s })}
                disabled={employee.status === s}
              >
                {EMPLOYEE_STATUS_CONFIG[s]?.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {TAB_KEYS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "profile" && <User className="h-3.5 w-3.5" />}
            {tab === "schedule" && <Clock className="h-3.5 w-3.5" />}
            {tab === "leaves" && <CalendarOff className="h-3.5 w-3.5" />}
            {t(`detail.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* ── FICHA ─────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> {t("detail.personalData")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { icon: Mail,   label: tCommon("email"),    value: employee.email },
                { icon: Phone,  label: tCommon("phone"), value: employee.phone },
                { icon: User,   label: t("detail.nif"),  value: employee.nif },
                { icon: User,   label: t("detail.ssNumber"),    value: employee.socialSecurityNumber },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ) : null)}
              {employee.address && (
                <div className="pt-1 border-t border-border text-muted-foreground text-xs">
                  {employee.address}{employee.city ? `, ${employee.city}` : ""}{employee.province ? ` (${employee.province})` : ""} {employee.postalCode}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> {t("detail.workData")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: "Contrato",       value: CONTRACT_LABELS[employee.contractType] },
                { label: "Fecha alta",     value: formatDate(employee.startDate) },
                { label: "Horas/semana",   value: `${Number(employee.workingHours)}h` },
                { label: "Salario bruto",  value: formatCurrency(Number(employee.salary)) },
                { label: "Coste mensual",  value: formatCurrency(Number(employee.salary) / 12) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {(employee.bankAccount || employee.bankHolder) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Datos bancarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {employee.bankHolder && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Titular</span>
                    <span className="font-medium">{employee.bankHolder}</span>
                  </div>
                )}
                {employee.bankAccount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IBAN</span>
                    <span className="font-mono text-xs">{employee.bankAccount}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {employee.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{employee.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── HORARIO ───────────────────────────── */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          {/* Clock in/out */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Fichaje hoy</p>
                <p className="text-xs text-muted-foreground">
                  {openEntry
                    ? `Entrada registrada a las ${new Date(openEntry.clockIn).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
                    : "Sin fichaje abierto"}
                </p>
              </div>
              <div className="flex gap-2">
                {!openEntry ? (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => clockIn.mutate({ employeeId: id })}
                    disabled={clockIn.isPending}
                  >
                    <LogIn className="h-4 w-4" />
                    Registrar entrada
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => clockOut.mutate({ entryId: openEntry.id, employeeId: id })}
                    disabled={clockOut.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                    Registrar salida
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {timeData && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Total mes actual: <span className="font-medium text-foreground">{timeData.summary}</span>
            </div>
          )}

          {/* Entries table */}
          <Card>
            <CardContent className="p-0">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Sin fichajes este mes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Fecha</th>
                        <th className="text-center font-medium text-muted-foreground px-4 py-3">Entrada</th>
                        <th className="text-center font-medium text-muted-foreground px-4 py-3">Salida</th>
                        <th className="text-center font-medium text-muted-foreground px-4 py-3">Descanso</th>
                        <th className="text-right font-medium text-muted-foreground px-4 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">{formatDate(entry.date)}</td>
                          <td className="px-4 py-3 text-center">
                            {new Date(entry.clockIn).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {entry.clockOut
                              ? new Date(entry.clockOut).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                              : <span className="text-amber-500 font-medium">Abierto</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">
                            {entry.breakMinutes > 0 ? `${entry.breakMinutes}m` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatMinutes(entry.totalMinutes)}
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
      )}

      {/* ── AUSENCIAS ─────────────────────────── */}
      {activeTab === "leaves" && (
        <div className="space-y-4">
          {/* New leave request form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" /> Nueva solicitud de ausencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, type: e.target.value }))}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Desde</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hasta</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!leaveForm.startDate || !leaveForm.endDate || createLeave.isPending}
                    onClick={() => {
                      createLeave.mutate({ employeeId: id, ...leaveForm });
                      setLeaveForm({ type: "VACATION", startDate: "", endDate: "", reason: "" });
                    }}
                  >
                    Solicitar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave list */}
          <Card>
            <CardContent className="p-0">
              {leaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CalendarOff className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Sin solicitudes de ausencia</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Tipo</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Período</th>
                        <th className="text-center font-medium text-muted-foreground px-4 py-3">Días</th>
                        <th className="text-center font-medium text-muted-foreground px-4 py-3">Estado</th>
                        <th className="px-4 py-3 w-28" />
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((leave) => {
                        const lsCfg = LEAVE_STATUS_CONFIG[leave.status] ?? LEAVE_STATUS_CONFIG.PENDING;
                        return (
                          <tr key={leave.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 font-medium">
                              {LEAVE_TYPE_LABELS[leave.type] ?? leave.type}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                            </td>
                            <td className="px-4 py-3 text-center font-medium">{leave.days}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", lsCfg!.color)}>
                                {lsCfg!.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {leave.status === "PENDING" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                                      onClick={() => approveLeave.mutate(leave.id)}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-500 hover:text-red-600"
                                      onClick={() => rejectLeave.mutate(leave.id)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {leave.status !== "APPROVED" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                      if (confirm("¿Eliminar esta solicitud?"))
                                        deleteLeave.mutate(leave.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
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
        </div>
      )}
    </div>
  );
}
