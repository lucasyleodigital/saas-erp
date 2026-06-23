"use client";

import { useState } from "react";
import {
  useTimeEntries,
  useCreateTimeEntry,
  useDeleteTimeEntry,
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
import {
  Plus,
  Timer,
  Clock,
  CalendarDays,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function TimeTrackingView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Timer className="h-6 w-6" />
            Control de horas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registra y gestiona el tiempo de trabajo
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar horas
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Hoy", value: todayHours, icon: Clock },
          { label: "Esta semana", value: weekHours, icon: CalendarDays },
          { label: "Este mes", value: monthHours, icon: Timer },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-semibold">
                      {s.value.toFixed(1)} h
                    </p>
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
                Error al cargar entradas
              </p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Timer className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">No hay entradas</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Registra la primera entrada de tiempo
              </p>
              <Button onClick={() => setDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Registrar horas
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Fecha
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Empleado
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                      Proyecto
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Entrada
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Salida
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">
                      Total
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                      Notas
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
                                <Badge variant="success">En curso</Badge>
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
                                if (confirm("Eliminar esta entrada?")) {
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
  const { data } = useEmployees({ limit: 200 });
  const employees = data?.data ?? [];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Todos los empleados" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Todos los empleados</SelectItem>
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
  const { data } = useProjects({ limit: 200 });
  const projects = data?.data ?? (Array.isArray(data) ? data : []);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Todos los proyectos" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Todos los proyectos</SelectItem>
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
          <DialogTitle>Registrar horas</DialogTitle>
          <DialogDescription>
            Registra una entrada de tiempo para un empleado
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Empleado *</Label>
            <Select
              value={form.employeeId}
              onValueChange={(v) => update("employeeId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empleado" />
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
            <Label>Proyecto (opcional)</Label>
            <Select
              value={form.projectId}
              onValueChange={(v) => update("projectId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin proyecto</SelectItem>
                {(Array.isArray(projects) ? projects : []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="te-date">Fecha *</Label>
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
              <Label htmlFor="te-in">Entrada *</Label>
              <Input
                id="te-in"
                type="time"
                value={form.clockIn}
                onChange={(e) => update("clockIn", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="te-out">Salida *</Label>
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
            <Label htmlFor="te-break">Descanso (min)</Label>
            <Input
              id="te-break"
              type="number"
              min="0"
              value={form.breakMinutes}
              onChange={(e) => update("breakMinutes", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="te-notes">Notas</Label>
            <Input
              id="te-notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Notas opcionales..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!form.employeeId || createEntry.isPending}
            >
              {createEntry.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
