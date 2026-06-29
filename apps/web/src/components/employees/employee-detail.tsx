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
import { api } from "@/lib/api";
import { toast } from "sonner";
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

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  INACTIVE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ON_LEAVE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const STATUS_T_KEYS: Record<string, string> = {
  ACTIVE: "active", INACTIVE: "inactive", ON_LEAVE: "onLeave",
};

const CONTRACT_T_KEYS: Record<string, string> = {
  INDEFINIDO: "indefinido", TEMPORAL: "temporal", PRACTICAS: "practicas",
  AUTONOMO: "autonomo", OBRA_SERVICIO: "obraServicio",
};

const LEAVE_TYPE_T_KEYS: Record<string, string> = {
  VACATION: "vacation", SICK: "sick", PERSONAL: "personal",
  MATERNITY: "maternity", PATERNITY: "maternity", OTHER: "other",
};

const LEAVE_STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const LEAVE_STATUS_T_KEYS: Record<string, string> = {
  PENDING: "pending", APPROVED: "approved", REJECTED: "rejected",
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

  const statusColor = STATUS_COLORS[employee.status] ?? STATUS_COLORS.ACTIVE;
  const statusTKey = STATUS_T_KEYS[employee.status] ?? "active";
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
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusColor)}>
                  {t(`statuses.${statusTKey}`)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{employee.position ?? t("detail.noPosition")}{employee.department ? ` · ${employee.department}` : ""}</p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={async () => {
            try {
              const r = await api.post(`/employees/${id}/generate-clock-token`);
              const url = `${window.location.origin}/fichar/${r.data.token}`;
              await navigator.clipboard.writeText(url);
              toast.success(t("detail.clockLinkCopied"));
            } catch { toast.error(t("detail.clockLinkError")); }
          }}
        >
          <Clock className="h-4 w-4" /> {t("detail.clockLink")}
        </Button>
        <PortalButton employeeId={id} employeeEmail={employee.email} />
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
                {t(`statuses.${STATUS_T_KEYS[s]}`)}
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
                { label: t("detail.contract"),       value: CONTRACT_T_KEYS[employee.contractType] ? t(`contracts.${CONTRACT_T_KEYS[employee.contractType]}`) : employee.contractType },
                { label: t("detail.startDate"),     value: formatDate(employee.startDate) },
                { label: t("detail.hoursPerWeek"),   value: `${Number(employee.workingHours)}h` },
                { label: t("detail.grossSalary"),  value: formatCurrency(Number(employee.salary)) },
                { label: t("detail.monthlyCost"),  value: formatCurrency(Number(employee.salary) / 12) },
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
                  <CreditCard className="h-4 w-4" /> {t("detail.bankData")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {employee.bankHolder && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("detail.holder")}</span>
                    <span className="font-medium">{employee.bankHolder}</span>
                  </div>
                )}
                {employee.bankAccount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("detail.iban")}</span>
                    <span className="font-mono text-xs">{employee.bankAccount}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {employee.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{tCommon("notes")}</CardTitle>
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
                <p className="font-medium">{t("detail.clockToday")}</p>
                <p className="text-xs text-muted-foreground">
                  {openEntry
                    ? t("detail.clockedInAt", { time: new Date(openEntry.clockIn).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" }) })
                    : t("detail.noOpenClock")}
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
                    {t("detail.clockIn")}
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
                    {t("detail.clockOut")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {timeData && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t("detail.totalCurrentMonth")} <span className="font-medium text-foreground">{timeData.summary}</span>
            </div>
          )}

          {/* Entries table */}
          <Card>
            <CardContent className="p-0">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t("detail.noClockThisMonth")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">{tCommon("date")}</th>
                        <th className="text-center font-medium text-muted-foreground px-4 py-3">{t("detail.entry")}</th>
                        <th className="text-center font-medium text-muted-foreground px-4 py-3">{t("detail.exit")}</th>
                        <th className="text-center font-medium text-muted-foreground px-4 py-3">{t("detail.breakTime")}</th>
                        <th className="text-right font-medium text-muted-foreground px-4 py-3">{tCommon("total")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">{formatDate(entry.date)}</td>
                          <td className="px-4 py-3 text-center">
                            {new Date(entry.clockIn).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {entry.clockOut
                              ? new Date(entry.clockOut).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })
                              : <span className="text-amber-500 font-medium">{t("detail.open")}</span>}
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
                <Plus className="h-4 w-4" /> {t("detail.newLeaveRequest")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("detail.type")}</Label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, type: e.target.value }))}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {Object.entries(LEAVE_TYPE_T_KEYS).map(([k, tKey]) => (
                      <option key={k} value={k}>{t(`leaveRequests.${tKey}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{tCommon("from")}</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{tCommon("to")}</Label>
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
                    {t("detail.requestLeave")}
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
                  <p className="text-sm text-muted-foreground">{t("detail.noLeaveRequests")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("detail.type")}</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("detail.period")}</th>
                        <th className="text-center font-medium text-muted-foreground px-4 py-3">{t("detail.days")}</th>
                        <th className="text-center font-medium text-muted-foreground px-4 py-3">{tCommon("status")}</th>
                        <th className="px-4 py-3 w-28" />
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((leave) => {
                        const lsColor = LEAVE_STATUS_COLORS[leave.status] ?? LEAVE_STATUS_COLORS.PENDING;
                        const lsTKey = LEAVE_STATUS_T_KEYS[leave.status] ?? "pending";
                        return (
                          <tr key={leave.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 font-medium">
                              {LEAVE_TYPE_T_KEYS[leave.type] ? t(`leaveRequests.${LEAVE_TYPE_T_KEYS[leave.type]}`) : leave.type}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                            </td>
                            <td className="px-4 py-3 text-center font-medium">{leave.days}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", lsColor)}>
                                {t(`leaveStatuses.${lsTKey}`)}
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
                                      if (confirm(t("detail.confirmDeleteLeave")))
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

function PortalButton({ employeeId, employeeEmail }: { employeeId: string; employeeEmail?: string | null }) {
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [creds, setCreds] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newPwd, setNewPwd] = useState("");

  async function loadCreds() {
    setLoading(true);
    try {
      const r = await api.get(`/employees/${employeeId}/portal-credentials`);
      setCreds(r.data);
    } catch {
      setCreds({ isActive: false });
    }
    setLoading(false);
    setOpen(true);
  }

  async function activate() {
    if (!newPwd || newPwd.length < 8) {
      toast.error(t("detail.portal.minChars"));
      return;
    }
    try {
      const r = await api.post(`/employees/${employeeId}/activate-portal`, { password: newPwd });
      setCreds({ isActive: true, email: r.data.email, password: newPwd });
      toast.success(t("detail.portal.activated"));
      setNewPwd("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error");
    }
  }

  async function resetPassword() {
    if (!newPwd || newPwd.length < 8) {
      toast.error(t("detail.portal.minChars"));
      return;
    }
    try {
      await api.post(`/employees/${employeeId}/reset-portal-password`, { password: newPwd });
      setCreds((prev: any) => ({ ...prev, password: newPwd }));
      toast.success(t("detail.portal.passwordUpdated"));
      setNewPwd("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error");
    }
  }

  async function copyCredentials() {
    if (creds?.email && creds?.password) {
      await navigator.clipboard.writeText(`${tCommon("email")}: ${creds.email}\n${t("detail.portal.password")}: ${creds.password}\nURL: ${window.location.origin}/login`);
      toast.success(t("detail.portal.credentialsCopied"));
    }
  }

  return (
    <>
      <Button variant="default" size="sm" className="gap-2" onClick={loadCreds} disabled={!employeeEmail}>
        <LogIn className="h-4 w-4" /> {t("detail.employeePortal")}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-background border rounded-xl p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{t("detail.portal.title")}</h3>

            {loading ? (
              <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
            ) : creds?.isActive ? (
              <>
                <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{tCommon("email")}</span>
                    <span className="font-medium">{creds.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("detail.portal.password")}</span>
                    <span className="font-mono font-medium">{creds.password ?? t("detail.portal.notSaved")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">URL</span>
                    <span className="font-mono text-xs">{window.location.origin}/login</span>
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={copyCredentials}>
                  {t("detail.portal.copyCredentials")}
                </Button>

                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">{t("detail.portal.changePassword")}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder={t("detail.portal.newPasswordPlaceholder")}
                      className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={resetPassword}>{t("detail.portal.change")}</Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {t("detail.portal.noAccess")}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder={t("detail.portal.passwordPlaceholder")}
                    className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  />
                  <Button onClick={activate}>{t("detail.portal.activate")}</Button>
                </div>
              </>
            )}

            <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>
              {tCommon("close")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
