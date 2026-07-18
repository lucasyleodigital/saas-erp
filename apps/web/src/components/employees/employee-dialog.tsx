"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateEmployee, SHIFT_LABELS, SHIFT_COLORS, type ShiftType } from "@/hooks/use-employees";
import { Loader2, User, Briefcase, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const SHIFT_TYPES: ShiftType[] = ["MANANA", "TARDE", "NOCHE", "PARTIDO", "LIBRE"];

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

const CONTRACT_KEYS = [
  { value: "INDEFINIDO",    key: "indefinido" },
  { value: "TEMPORAL",      key: "temporal" },
  { value: "PRACTICAS",     key: "practicas" },
  { value: "AUTONOMO",      key: "autonomo" },
  { value: "OBRA_SERVICIO", key: "obraServicio" },
];

const schema = z.object({
  // Personal
  firstName:           z.string().min(1, "Obligatorio"),
  lastName:            z.string().min(1, "Obligatorio"),
  email:               z.string().email("Email inválido").optional().or(z.literal("")),
  phone:               z.string().optional(),
  nif:                 z.string().optional(),
  address:             z.string().optional(),
  city:                z.string().optional(),
  province:            z.string().optional(),
  postalCode:          z.string().optional(),
  notes:               z.string().optional(),
  // Laboral
  position:            z.string().optional(),
  department:          z.string().optional(),
  contractType:        z.string(),
  startDate:           z.string().min(1, "Obligatorio"),
  endDate:             z.string().optional(),
  salary:              z.coerce.number().min(0),
  workingHours:        z.coerce.number().min(1).max(60),
  costCenter:          z.string().optional(),
  // Banco
  bankHolder:          z.string().optional(),
  bankAccount:         z.string().optional(),
  // SS
  socialSecurityNumber: z.string().optional(),
  ssRegistrationDate:  z.string().optional(),
  ssContributionGroup: z.string().optional(),
  occupationCode:      z.string().optional(),
  // Turno
  defaultShiftType:    z.string().optional(),
  shiftStart:          z.string().optional(),
  shiftEnd:            z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type DialogTab = "personal" | "laboral" | "banco" | "ss";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TABS: { key: DialogTab; label: string; icon: React.ElementType }[] = [
  { key: "personal", label: "Personal",  icon: User },
  { key: "laboral",  label: "Laboral",   icon: Briefcase },
  { key: "banco",    label: "Banco",     icon: CreditCard },
  { key: "ss",       label: "SS / Turno",icon: ShieldCheck },
];

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function EmployeeDialog({ open, onOpenChange }: EmployeeDialogProps) {
  const t = useTranslations("employees.dialog");
  const createEmployee = useCreateEmployee();
  const today = new Date().toISOString().split("T")[0]!;
  const [tab, setTab] = useState<DialogTab>("personal");

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { contractType: "INDEFINIDO", startDate: today, salary: 0, workingHours: 40 },
  });

  const shiftType = watch("defaultShiftType") as ShiftType | undefined;

  useEffect(() => {
    if (open) {
      reset({ contractType: "INDEFINIDO", startDate: today, salary: 0, workingHours: 40 });
      setTab("personal");
    }
  }, [open, reset, today]);

  async function onSubmit(data: FormData) {
    await createEmployee.mutateAsync({
      ...data,
      email:    data.email    || undefined,
      endDate:  data.endDate  || undefined,
      ssRegistrationDate: data.ssRegistrationDate || undefined,
      defaultShiftType:   data.defaultShiftType   || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {/* Sub-tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit mb-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                tab === key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3 w-3" /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ── PERSONAL ── */}
          {tab === "personal" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Nombre *" error={errors.firstName?.message}>
                <Input {...register("firstName")} placeholder="Juan" />
              </F>
              <F label="Apellidos *" error={errors.lastName?.message}>
                <Input {...register("lastName")} placeholder="García López" />
              </F>
              <F label="Email" error={errors.email?.message}>
                <Input type="email" {...register("email")} placeholder="juan@empresa.com" />
              </F>
              <F label="Teléfono">
                <Input {...register("phone")} placeholder="612 345 678" />
              </F>
              <F label="NIF / DNI">
                <Input {...register("nif")} placeholder="12345678A" />
              </F>
              <F label="Nº afiliación SS (NAFS)">
                <Input {...register("socialSecurityNumber")} placeholder="12 dígitos" />
              </F>
              <F label="Dirección">
                <Input {...register("address")} placeholder="Calle Mayor, 1" />
              </F>
              <F label="Ciudad">
                <Input {...register("city")} placeholder="Madrid" />
              </F>
              <F label="Provincia">
                <Input {...register("province")} placeholder="Madrid" />
              </F>
              <F label="Código postal">
                <Input {...register("postalCode")} placeholder="28001" />
              </F>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Notas</Label>
                <textarea rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register("notes")} />
              </div>
            </div>
          )}

          {/* ── LABORAL ── */}
          {tab === "laboral" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Cargo / Puesto">
                <Input {...register("position")} placeholder="Desarrollador Senior" />
              </F>
              <F label="Departamento">
                <Input {...register("department")} placeholder="Tecnología" />
              </F>
              <F label="Tipo de contrato">
                <select {...register("contractType")}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {CONTRACT_KEYS.map((o) => (
                    <option key={o.value} value={o.value}>{t(`contracts.${o.key}`)}</option>
                  ))}
                </select>
              </F>
              <F label="Fecha de alta *" error={errors.startDate?.message}>
                <Input type="date" {...register("startDate")} />
              </F>
              <F label="Fecha fin contrato">
                <Input type="date" {...register("endDate")} />
              </F>
              <F label="Salario bruto anual (€)" error={errors.salary?.message}>
                <Input type="number" step="0.01" min="0" {...register("salary")} placeholder="24000" />
              </F>
              <F label="Horas semanales">
                <Input type="number" step="0.5" min="1" max="60" {...register("workingHours")} placeholder="40" />
              </F>
              <F label="Centro de coste">
                <Input {...register("costCenter")} placeholder="Ej. CC-001" />
              </F>
            </div>
          )}

          {/* ── BANCO ── */}
          {tab === "banco" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Titular de la cuenta">
                <Input {...register("bankHolder")} placeholder="Juan García López" />
              </F>
              <F label="IBAN">
                <Input {...register("bankAccount")} placeholder="ES91 2100 0418 4502 0005 1332" className="font-mono" />
              </F>
            </div>
          )}

          {/* ── SS / TURNO ── */}
          {tab === "ss" && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Alta en Seguridad Social</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Fecha de alta en SS">
                    <Input type="date" {...register("ssRegistrationDate")} />
                  </F>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Grupo de cotización</Label>
                    <select {...register("ssContributionGroup")}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">— Seleccionar grupo —</option>
                      {SS_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <F label="Código de ocupación (CNO)">
                    <Input {...register("occupationCode")} placeholder="Ej. 2411" />
                  </F>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Turno de trabajo</p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Turno habitual</Label>
                    <div className="flex gap-2 flex-wrap">
                      {SHIFT_TYPES.map((s) => (
                        <button key={s} type="button"
                          onClick={() => setValue("defaultShiftType", shiftType === s ? "" : s)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            shiftType === s
                              ? SHIFT_COLORS[s] + " border-transparent"
                              : "border-border bg-background text-muted-foreground hover:border-primary"
                          )}
                        >
                          {SHIFT_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Hora entrada">
                      <Input type="time" {...register("shiftStart")} />
                    </F>
                    <F label="Hora salida">
                      <Input type="time" {...register("shiftEnd")} />
                    </F>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createEmployee.isPending}>
              {createEmployee.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
