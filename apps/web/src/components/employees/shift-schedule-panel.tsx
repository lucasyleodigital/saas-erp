"use client";

import { useState } from "react";
import {
  useEmployees,
  useShiftAssignments,
  useUpsertShift,
  useDeleteShift,
  SHIFT_LABELS,
  SHIFT_COLORS,
  type ShiftType,
} from "@/hooks/use-employees";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SHIFT_TYPES_LIST: ShiftType[] = ["MANANA", "TARDE", "NOCHE", "PARTIDO", "LIBRE"];
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function isoDate(d: Date) {
  return d.toISOString().substring(0, 10);
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function weekStart(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}

export function ShiftSchedulePanel() {
  const [refDate, setRefDate] = useState(() => weekStart(new Date()));
  const [popover, setPopover] = useState<{ empId: string; date: string } | null>(null);

  const monday = weekStart(refDate);
  const days   = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const from   = isoDate(days[0]);
  const to     = isoDate(days[6]);

  const { data: employeesData } = useEmployees({ limit: 100, status: "ACTIVE" });
  const { data: shifts = [] }   = useShiftAssignments({ from, to });
  const upsert = useUpsertShift();
  const remove = useDeleteShift();

  const empList = employeesData?.data ?? [];

  const shiftMap = new Map<string, typeof shifts[0]>();
  shifts.forEach((s) => shiftMap.set(`${s.employeeId}__${s.date.substring(0, 10)}`, s));

  function handleCellClick(empId: string, date: string) {
    setPopover((p) => (p?.empId === empId && p?.date === date ? null : { empId, date }));
  }

  function assignShift(empId: string, date: string, shiftType: ShiftType) {
    upsert.mutate({ employeeId: empId, date, shiftType });
    setPopover(null);
  }

  function clearShift(empId: string, date: string) {
    const existing = shiftMap.get(`${empId}__${date}`);
    if (existing) remove.mutate(existing.id);
    setPopover(null);
  }

  return (
    <div className="space-y-4" onClick={() => setPopover(null)}>
      {/* Navegación semana */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="sm"
          onClick={(e) => { e.stopPropagation(); setRefDate(addDays(monday, -7)); }}>
          ← Anterior
        </Button>
        <span className="text-sm font-medium">
          {monday.toLocaleDateString("es-ES", { day: "2-digit", month: "long" })}
          {" – "}
          {days[6].toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
        <Button variant="outline" size="sm"
          onClick={(e) => { e.stopPropagation(); setRefDate(addDays(monday, 7)); }}>
          Siguiente →
        </Button>
        <Button variant="ghost" size="sm"
          onClick={(e) => { e.stopPropagation(); setRefDate(weekStart(new Date())); }}>
          Esta semana
        </Button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground min-w-[160px]">
                Empleado
              </th>
              {days.map((d, i) => {
                const isToday = isoDate(d) === isoDate(new Date());
                return (
                  <th key={i}
                    className={cn(
                      "px-2 py-3 text-center font-medium min-w-[90px]",
                      isToday ? "text-primary bg-primary/5" : "text-muted-foreground",
                      i >= 5 && "opacity-60",
                    )}>
                    <div>{DAY_NAMES[i]}</div>
                    <div className="text-xs font-normal">{d.getDate()}/{d.getMonth() + 1}</div>
                  </th>
                );
              })}
              <th className="px-3 py-3 text-center font-medium text-muted-foreground min-w-[100px]">
                Turno hab.
              </th>
            </tr>
          </thead>
          <tbody>
            {empList.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-muted-foreground text-sm">
                  No hay empleados activos.
                </td>
              </tr>
            )}
            {empList.map((emp) => (
              <tr key={emp.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-sm">{emp.firstName} {emp.lastName}</div>
                  {emp.position && (
                    <div className="text-xs text-muted-foreground">{emp.position}</div>
                  )}
                </td>

                {days.map((d, i) => {
                  const dateStr = isoDate(d);
                  const shift   = shiftMap.get(`${emp.id}__${dateStr}`);
                  const isOpen  = popover?.empId === emp.id && popover?.date === dateStr;

                  return (
                    <td key={i} className={cn("px-1 py-1.5 text-center relative", i >= 5 && "opacity-60")}>
                      <button
                        className={cn(
                          "w-full h-10 rounded-lg text-xs font-medium transition-colors border",
                          shift
                            ? SHIFT_COLORS[shift.shiftType] + " border-transparent hover:opacity-80"
                            : "border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary bg-transparent",
                        )}
                        onClick={(e) => { e.stopPropagation(); handleCellClick(emp.id, dateStr); }}
                      >
                        {shift ? SHIFT_LABELS[shift.shiftType] : "+"}
                      </button>

                      {isOpen && (
                        <div
                          className="absolute z-50 top-12 left-1/2 -translate-x-1/2 bg-background border border-border rounded-xl shadow-xl p-2 min-w-[150px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-xs text-muted-foreground mb-2 px-1 font-medium">
                            {DAY_NAMES[i]} {d.getDate()}/{d.getMonth() + 1}
                          </p>
                          <div className="space-y-0.5">
                            {SHIFT_TYPES_LIST.map((s) => (
                              <button key={s}
                                className={cn(
                                  "w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                  shift?.shiftType === s
                                    ? SHIFT_COLORS[s]
                                    : "hover:bg-muted text-foreground",
                                )}
                                onClick={() => assignShift(emp.id, dateStr, s)}
                              >
                                {SHIFT_LABELS[s]}
                              </button>
                            ))}
                            {shift && (
                              <button
                                className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-border mt-1 pt-2"
                                onClick={() => clearShift(emp.id, dateStr)}
                              >
                                Quitar turno
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}

                <td className="px-3 py-2 text-center">
                  {emp.defaultShiftType ? (
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      SHIFT_COLORS[emp.defaultShiftType],
                    )}>
                      {SHIFT_LABELS[emp.defaultShiftType]}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <span className="font-medium">Leyenda:</span>
        {SHIFT_TYPES_LIST.map((s) => (
          <span key={s} className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 font-medium", SHIFT_COLORS[s])}>
            {SHIFT_LABELS[s]}
          </span>
        ))}
        <span className="ml-2">· Haz clic en una celda para asignar o cambiar el turno.</span>
      </div>
    </div>
  );
}
