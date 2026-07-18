"use client";

import { useState, useEffect } from "react";
import {
  useEmployee, useUpdateEmployee, useTimeEntries, useClockIn, useClockOut,
  useLeaveRequests, useCreateLeaveRequest, useApproveLeave, useRejectLeave,
  useDeleteLeaveRequest, SHIFT_LABELS, SHIFT_COLORS, type ShiftType,
} from "@/hooks/use-employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft, User, Clock, CalendarOff, LogIn, LogOut, CheckCircle, XCircle,
  Trash2, ChevronDown, Plus, Briefcase, Phone, Mail, CreditCard, Pencil,
  Save, X, ShieldCheck,
} from "lucide-react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";

const TAB_KEYS = ["profile", "ss", "schedule", "leaves"] as const;
type Tab = typeof TAB_KEYS[number];

const LOCALE_MAP: Record<string, string> = {
  es: "es-ES", en: "en-US", ca: "ca-ES", eu: "eu-ES", gl: "gl-ES",
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  INACTIVE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ON_LEAVE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};
const STATUS_T_KEYS: Record<string, string> = { ACTIVE: "active", INACTIVE: "inactive", ON_LEAVE: "onLeave" };
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
const LEAVE_STATUS_T_KEYS: Record<string, string> = { PENDING: "pending", APPROVED: "approved", REJECTED: "rejected" };

const SS_GROUPS = [
  { value: "01", label: "01 – Ingenieros y licenciados" },
  { value: "02", label: "02 – Ingenieros técnicos" },
  { value: "03", label: "03 – Jefes administrativos" },
  { value: "04", label: "04 – Ayudantes no titulados" },
  { value: "05", label: "05 – Oficiales administrativos" },
  { value: "06", label: "06 – Subalternos" },
  { value: "07", label: "07 – Auxiliares administrativos" },
  { value: "08", label: "08 – Oficiales de primera y segunda" },
  { value: "09", label: "09 – Oficiales de tercera y especialistas" },
  { value: "10", label: "10 – Peones" },
  { value: "11", label: "11 – Trabajadores menores de 18 años" },
];

const SHIFT_TYPES: ShiftType[] = ["MANANA", "TARDE", "NOCHE", "PARTIDO", "LIBRE"];

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}
function formatMinutes(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
function toDateInput(val?: string | null) {
  if (!val) return "";
  return val.substring(0, 10);
}

// ── Inline field ──────────────────────────────────────────────
function Field({ label, value }: { label: string; value?: string | null }) {
  return value ? (
    <div className="flex justify-between text-sm py-1 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] break-words">{value}</span>
    </div>
  ) : null;
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
  const { data: timeData } = useTimeEntries(id, { month: now.getMonth() + 1, year: now.getFullYear() });
  const { data: leaveData } = useLeaveRequests({ employeeId: id });

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [leaveForm, setLeaveForm] = useState({ type: "VACATION", startDate: "", endDate: "", reason: "" });

  // ── Edit mode ──
  const [editProfile, setEditProfile] = useState(false);
  const [editSS, setEditSS]           = useState(false);
  const [editShift, setEditShift]     = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (employee) setForm(employee as any);
  }, [employee]);

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
  const entries = timeData?.entries ?? [];
  const leaves  = leaveData ?? [];
  const openEntry = entries.find((e) => !e.clockOut);

  function saveSection(fields: string[]) {
    const data: Record<string, any> = { id };
    fields.forEach((k) => (data[k] = form[k]));
    updateEmployee.mutate(data);
  }

  function setF(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const shiftBadge = employee.defaultShiftType
    ? SHIFT_COLORS[employee.defaultShiftType]
    : "bg-gray-100 text-gray-500 dark:bg-gray-800";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/empleados"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
            {getInitials(employee.firstName, employee.lastName)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{employee.firstName} {employee.lastName}</h1>
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusColor)}>
                {t(`statuses.${STATUS_T_KEYS[employee.status] ?? "active"}`)}
              </span>
              {employee.defaultShiftType && (
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", shiftBadge)}>
                  {SHIFT_LABELS[employee.defaultShiftType]}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {employee.position ?? t("detail.noPosition")}{employee.department ? ` · ${employee.department}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2"
            onClick={async () => {
              try {
                const r = await api.post(`/employees/${id}/generate-clock-token`);
                await navigator.clipboard.writeText(`${window.location.origin}/fichar/${r.data.token}`);
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
                <DropdownMenuItem key={s}
                  onClick={() => updateEmployee.mutate({ id, status: s })}
                  disabled={employee.status === s}
                >
                  {t(`statuses.${STATUS_T_KEYS[s]}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit flex-wrap">
        {TAB_KEYS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors",
              activeTab === tab ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "profile"  && <User className="h-3.5 w-3.5" />}
            {tab === "ss"       && <ShieldCheck className="h-3.5 w-3.5" />}
            {tab === "schedule" && <Clock className="h-3.5 w-3.5" />}
            {tab === "leaves"   && <CalendarOff className="h-3.5 w-3.5" />}
            {tab === "profile"  ? t("detail.tabs.profile")  :
             tab === "ss"       ? "Alta SS / Turno"          :
             tab === "schedule" ? t("detail.tabs.schedule") :
                                  t("detail.tabs.leaves")}
          </button>
        ))}
      </div>

      {/* ── FICHA ──────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          {/* Datos personales */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> {t("detail.personalData")}
              </CardTitle>
              {!editProfile ? (
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setEditProfile(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" className="gap-1" onClick={() => {
                    saveSection(["firstName","lastName","email","phone","nif","socialSecurityNumber","address","city","province","postalCode","notes"]);
                    setEditProfile(false);
                  }} disabled={updateEmployee.isPending}>
                    <Save className="h-3.5 w-3.5" /> Guardar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setForm(employee as any); setEditProfile(false); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!editProfile ? (
                <div className="space-y-0 text-sm">
                  <Field label="Nombre" value={`${employee.firstName} ${employee.lastName}`} />
                  <Field label={tCommon("email")} value={employee.email} />
                  <Field label="Teléfono" value={employee.phone} />
                  <Field label="NIF / DNI" value={employee.nif} />
                  <Field label="Nº SS" value={employee.socialSecurityNumber} />
                  {employee.address && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">Dirección</span>
                      <span className="font-medium text-right">
                        {employee.address}{employee.city ? `, ${employee.city}` : ""}{employee.province ? ` (${employee.province})` : ""} {employee.postalCode}
                      </span>
                    </div>
                  )}
                  <Field label="Notas" value={employee.notes} />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    { key: "firstName", label: "Nombre" },
                    { key: "lastName",  label: "Apellidos" },
                    { key: "email",     label: "Email" },
                    { key: "phone",     label: "Teléfono" },
                    { key: "nif",       label: "NIF / DNI" },
                    { key: "socialSecurityNumber", label: "Nº afiliación SS" },
                    { key: "address",   label: "Dirección" },
                    { key: "city",      label: "Ciudad" },
                    { key: "province",  label: "Provincia" },
                    { key: "postalCode",label: "Código postal" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input className="h-8" value={form[key] ?? ""} onChange={(e) => setF(key, e.target.value)} />
                    </div>
                  ))}
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Notas</Label>
                    <textarea
                      rows={2}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={form.notes ?? ""}
                      onChange={(e) => setF("notes", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datos laborales */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> {t("detail.workData")}
              </CardTitle>
              {!editProfile ? null : null}
            </CardHeader>
            <CardContent>
              {!editProfile ? (
                <div className="space-y-0 text-sm">
                  <Field label="Tipo de contrato"
                    value={CONTRACT_T_KEYS[employee.contractType] ? t(`contracts.${CONTRACT_T_KEYS[employee.contractType]}`) : employee.contractType} />
                  <Field label="Fecha de alta" value={formatDate(employee.startDate)} />
                  {employee.endDate && <Field label="Fecha de baja" value={formatDate(employee.endDate)} />}
                  <Field label="Horas semanales" value={`${Number(employee.workingHours)}h`} />
                  <Field label="Salario bruto anual" value={formatCurrency(Number(employee.salary))} />
                  <Field label="Coste mensual" value={formatCurrency(Number(employee.salary) / 12)} />
                  {employee.costCenter && <Field label="Centro de coste" value={employee.costCenter} />}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de contrato</Label>
                    <select className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={form.contractType ?? "INDEFINIDO"} onChange={(e) => setF("contractType", e.target.value)}>
                      {Object.keys(CONTRACT_T_KEYS).map((k) => (
                        <option key={k} value={k}>{t(`contracts.${CONTRACT_T_KEYS[k]}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha de alta</Label>
                    <Input type="date" className="h-8" value={toDateInput(form.startDate)} onChange={(e) => setF("startDate", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha fin contrato</Label>
                    <Input type="date" className="h-8" value={toDateInput(form.endDate)} onChange={(e) => setF("endDate", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Horas semanales</Label>
                    <Input type="number" className="h-8" value={form.workingHours ?? 40} onChange={(e) => setF("workingHours", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Salario bruto anual (€)</Label>
                    <Input type="number" className="h-8" value={form.salary ?? ""} onChange={(e) => setF("salary", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Centro de coste</Label>
                    <Input className="h-8" value={form.costCenter ?? ""} onChange={(e) => setF("costCenter", e.target.value)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datos bancarios */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> {t("detail.bankData")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!editProfile ? (
                <div className="space-y-0 text-sm">
                  <Field label={t("detail.holder")} value={employee.bankHolder} />
                  <Field label={t("detail.iban")} value={employee.bankAccount} />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <Label className="text-xs">Titular de la cuenta</Label>
                    <Input className="h-8" value={form.bankHolder ?? ""} onChange={(e) => setF("bankHolder", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">IBAN</Label>
                    <Input className="h-8 font-mono" value={form.bankAccount ?? ""} onChange={(e) => setF("bankAccount", e.target.value)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── ALTA SS + TURNO ──────────────────────────────────── */}
      {activeTab === "ss" && (
        <div className="space-y-4">
          {/* Seguridad Social */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Alta en Seguridad Social
              </CardTitle>
              {!editSS ? (
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setEditSS(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" className="gap-1" onClick={() => {
                    saveSection(["socialSecurityNumber","ssRegistrationDate","ssContributionGroup","occupationCode"]);
                    setEditSS(false);
                  }} disabled={updateEmployee.isPending}>
                    <Save className="h-3.5 w-3.5" /> Guardar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setForm(employee as any); setEditSS(false); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!editSS ? (
                <div className="space-y-0 text-sm">
                  <Field label="Nº afiliación SS (NAFS)" value={employee.socialSecurityNumber} />
                  <Field label="Fecha de alta en SS" value={employee.ssRegistrationDate ? formatDate(employee.ssRegistrationDate) : null} />
                  <Field label="Grupo de cotización"
                    value={employee.ssContributionGroup
                      ? SS_GROUPS.find((g) => g.value === employee.ssContributionGroup)?.label ?? employee.ssContributionGroup
                      : null} />
                  <Field label="Código de ocupación (CNO)" value={employee.occupationCode} />
                  {!employee.socialSecurityNumber && (
                    <p className="text-xs text-muted-foreground py-2">Sin datos de alta en SS. Pulsa <strong>Editar</strong> para añadirlos.</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <Label className="text-xs">Nº afiliación SS (NAFS)</Label>
                    <Input className="h-8" placeholder="12 dígitos" value={form.socialSecurityNumber ?? ""} onChange={(e) => setF("socialSecurityNumber", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha de alta en SS</Label>
                    <Input type="date" className="h-8" value={toDateInput(form.ssRegistrationDate)} onChange={(e) => setF("ssRegistrationDate", e.target.value)} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Grupo de cotización</Label>
                    <select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={form.ssContributionGroup ?? ""} onChange={(e) => setF("ssContributionGroup", e.target.value)}>
                      <option value="">— Seleccionar grupo —</option>
                      {SS_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Código de ocupación (CNO)</Label>
                    <Input className="h-8" placeholder="Ej. 2411" value={form.occupationCode ?? ""} onChange={(e) => setF("occupationCode", e.target.value)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Turno de trabajo */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" /> Turno de trabajo
              </CardTitle>
              {!editShift ? (
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setEditShift(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" className="gap-1" onClick={() => {
                    saveSection(["defaultShiftType","shiftStart","shiftEnd"]);
                    setEditShift(false);
                  }} disabled={updateEmployee.isPending}>
                    <Save className="h-3.5 w-3.5" /> Guardar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setForm(employee as any); setEditShift(false); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!editShift ? (
                <div className="space-y-0 text-sm">
                  {employee.defaultShiftType ? (
                    <>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Turno habitual</span>
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", SHIFT_COLORS[employee.defaultShiftType])}>
                          {SHIFT_LABELS[employee.defaultShiftType]}
                        </span>
                      </div>
                      {employee.shiftStart && employee.shiftEnd && (
                        <Field label="Horario habitual" value={`${employee.shiftStart} – ${employee.shiftEnd}`} />
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">Sin turno asignado. Pulsa <strong>Editar</strong> para configurarlo.</p>
                  )}
                  <p className="text-xs text-muted-foreground pt-2">
                    Para asignar turnos día a día ve al <strong>Cuadro de Horarios</strong> en la lista de empleados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-xs">Turno habitual</Label>
                    <div className="flex gap-2 flex-wrap">
                      {SHIFT_TYPES.map((s) => (
                        <button key={s}
                          type="button"
                          onClick={() => setF("defaultShiftType", form.defaultShiftType === s ? null : s)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            form.defaultShiftType === s
                              ? SHIFT_COLORS[s] + " border-transparent"
                              : "border-border bg-background text-muted-foreground hover:border-primary"
                          )}
                        >
                          {SHIFT_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hora entrada</Label>
                    <Input type="time" className="h-8" value={form.shiftStart ?? ""} onChange={(e) => setF("shiftStart", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hora salida</Label>
                    <Input type="time" className="h-8" value={form.shiftEnd ?? ""} onChange={(e) => setF("shiftEnd", e.target.value)} />
                  </div>
                  {form.defaultShiftType === "PARTIDO" && (
                    <div className="sm:col-span-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      Turno partido: configura la hora de entrada y salida del primer tramo. El segundo tramo se registra manualmente en el fichaje.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── HORARIO (fichajes) ───────────────────────────────── */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
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
                  <Button size="sm" className="gap-2" onClick={() => clockIn.mutate({ employeeId: id })} disabled={clockIn.isPending}>
                    <LogIn className="h-4 w-4" /> {t("detail.clockIn")}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="gap-2"
                    onClick={() => clockOut.mutate({ entryId: openEntry.id, employeeId: id })} disabled={clockOut.isPending}>
                    <LogOut className="h-4 w-4" /> {t("detail.clockOut")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {timeData && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t("detail.totalCurrentMonth")} <span className="font-medium text-foreground">{timeData.summary}</span>
            </div>
          )}

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
                          <td className="px-4 py-3 text-right font-medium">{formatMinutes(entry.totalMinutes)}</td>
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

      {/* ── AUSENCIAS ───────────────────────────────────────── */}
      {activeTab === "leaves" && (
        <div className="space-y-4">
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
                  <select value={leaveForm.type} onChange={(e) => setLeaveForm((f) => ({ ...f, type: e.target.value }))}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {Object.entries(LEAVE_TYPE_T_KEYS).map(([k, tKey]) => (
                      <option key={k} value={k}>{t(`leaveRequests.${tKey}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{tCommon("from")}</Label>
                  <Input type="date" className="h-9" value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{tCommon("to")}</Label>
                  <Input type="date" className="h-9" value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
                <div className="flex items-end">
                  <Button size="sm" className="w-full"
                    disabled={!leaveForm.startDate || !leaveForm.endDate || createLeave.isPending}
                    onClick={() => {
                      createLeave.mutate({ employeeId: id, ...leaveForm });
                      setLeaveForm({ type: "VACATION", startDate: "", endDate: "", reason: "" });
                    }}>
                    {t("detail.requestLeave")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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
                      {leaves.map((leave) => (
                        <tr key={leave.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium">
                            {LEAVE_TYPE_T_KEYS[leave.type] ? t(`leaveRequests.${LEAVE_TYPE_T_KEYS[leave.type]}`) : leave.type}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{leave.days}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              LEAVE_STATUS_COLORS[leave.status] ?? LEAVE_STATUS_COLORS.PENDING)}>
                              {t(`leaveStatuses.${LEAVE_STATUS_T_KEYS[leave.status] ?? "pending"}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {leave.status === "PENDING" && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                                    onClick={() => approveLeave.mutate(leave.id)}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600"
                                    onClick={() => rejectLeave.mutate(leave.id)}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {leave.status !== "APPROVED" && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => { if (confirm(t("detail.confirmDeleteLeave"))) deleteLeave.mutate(leave.id); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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
    </div>
  );
}

// ── Portal button (unchanged) ────────────────────────────────
function PortalButton({ employeeId, employeeEmail }: { employeeId: string; employeeEmail?: string | null }) {
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [creds, setCreds] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newPwd, setNewPwd] = useState("");

  async function loadCreds() {
    setLoading(true);
    try { const r = await api.get(`/employees/${employeeId}/portal-credentials`); setCreds(r.data); }
    catch { setCreds({ isActive: false }); }
    setLoading(false);
    setOpen(true);
  }
  async function activate() {
    if (!newPwd || newPwd.length < 8) { toast.error(t("detail.portal.minChars")); return; }
    try {
      const r = await api.post(`/employees/${employeeId}/activate-portal`, { password: newPwd });
      setCreds({ isActive: true, email: r.data.email, password: newPwd });
      toast.success(t("detail.portal.activated")); setNewPwd("");
    } catch (e: any) { toast.error(e?.response?.data?.message ?? "Error"); }
  }
  async function resetPassword() {
    if (!newPwd || newPwd.length < 8) { toast.error(t("detail.portal.minChars")); return; }
    try {
      await api.post(`/employees/${employeeId}/reset-portal-password`, { password: newPwd });
      setCreds((prev: any) => ({ ...prev, password: newPwd }));
      toast.success(t("detail.portal.passwordUpdated")); setNewPwd("");
    } catch (e: any) { toast.error(e?.response?.data?.message ?? "Error"); }
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
            {loading ? <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
              : creds?.isActive ? (
                <>
                  <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{tCommon("email")}</span><span className="font-medium">{creds.email}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("detail.portal.password")}</span><span className="font-mono font-medium">{creds.password ?? t("detail.portal.notSaved")}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">URL</span><span className="font-mono text-xs">{window.location.origin}/login</span></div>
                  </div>
                  <Button className="w-full gap-2" onClick={async () => {
                    await navigator.clipboard.writeText(`${tCommon("email")}: ${creds.email}\n${t("detail.portal.password")}: ${creds.password}\nURL: ${window.location.origin}/login`);
                    toast.success(t("detail.portal.credentialsCopied"));
                  }}>{t("detail.portal.copyCredentials")}</Button>
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">{t("detail.portal.changePassword")}</p>
                    <div className="flex gap-2">
                      <input type="text" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                        placeholder={t("detail.portal.newPasswordPlaceholder")}
                        className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm" />
                      <Button size="sm" variant="outline" onClick={resetPassword}>{t("detail.portal.change")}</Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{t("detail.portal.noAccess")}</p>
                  <div className="flex gap-2">
                    <input type="text" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                      placeholder={t("detail.portal.passwordPlaceholder")}
                      className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm" />
                    <Button onClick={activate}>{t("detail.portal.activate")}</Button>
                  </div>
                </>
              )}
            <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>{tCommon("close")}</Button>
          </div>
        </div>
      )}
    </>
  );
}
