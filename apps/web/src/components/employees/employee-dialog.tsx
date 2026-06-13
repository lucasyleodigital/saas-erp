"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateEmployee } from "@/hooks/use-employees";
import { Loader2 } from "lucide-react";

const schema = z.object({
  firstName:    z.string().min(1, "Obligatorio"),
  lastName:     z.string().min(1, "Obligatorio"),
  email:        z.string().email("Email inválido").optional().or(z.literal("")),
  phone:        z.string().optional(),
  nif:          z.string().optional(),
  position:     z.string().optional(),
  department:   z.string().optional(),
  contractType: z.string(),
  startDate:    z.string().min(1, "Obligatorio"),
  salary:       z.coerce.number().min(0, "Debe ser positivo"),
  workingHours: z.coerce.number().min(1).max(60),
});

type FormData = z.infer<typeof schema>;

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CONTRACT_OPTIONS = [
  { value: "INDEFINIDO",    label: "Indefinido" },
  { value: "TEMPORAL",      label: "Temporal" },
  { value: "PRACTICAS",     label: "Prácticas" },
  { value: "AUTONOMO",      label: "Autónomo" },
  { value: "OBRA_SERVICIO", label: "Obra y servicio" },
];

export function EmployeeDialog({ open, onOpenChange }: EmployeeDialogProps) {
  const createEmployee = useCreateEmployee();
  const today = new Date().toISOString().split("T")[0]!;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contractType: "INDEFINIDO",
      startDate: today,
      salary: 0,
      workingHours: 40,
    },
  });

  useEffect(() => {
    if (open) reset({
      contractType: "INDEFINIDO",
      startDate: today,
      salary: 0,
      workingHours: 40,
    });
  }, [open, reset, today]);

  async function onSubmit(data: FormData) {
    await createEmployee.mutateAsync({
      ...data,
      email: data.email || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo empleado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Datos personales */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Datos personales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input {...register("firstName")} placeholder="Juan" />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Apellidos *</Label>
                <Input {...register("lastName")} placeholder="García López" />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...register("email")} placeholder="juan@empresa.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input {...register("phone")} placeholder="612345678" />
              </div>
              <div className="space-y-1.5">
                <Label>NIF/NIE</Label>
                <Input {...register("nif")} placeholder="12345678A" />
              </div>
            </div>
          </div>

          {/* Datos laborales */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Datos laborales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input {...register("position")} placeholder="Desarrollador Senior" />
              </div>
              <div className="space-y-1.5">
                <Label>Departamento</Label>
                <Input {...register("department")} placeholder="Tecnología" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de contrato</Label>
                <select
                  {...register("contractType")}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CONTRACT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de alta *</Label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Salario bruto anual (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("salary")}
                  placeholder="24000.00"
                />
                {errors.salary && <p className="text-xs text-destructive">{errors.salary.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Horas semanales</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="60"
                  {...register("workingHours")}
                  placeholder="40"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createEmployee.isPending}>
              {createEmployee.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Crear empleado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
