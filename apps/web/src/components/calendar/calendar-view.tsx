"use client";

import { useState, useMemo } from "react";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarEvent {
  date: string;
  type: "invoice_due" | "invoice_issued" | "quote_expiry";
  title: string;
  amount?: number;
}

const EVENT_CONFIG: Record<
  CalendarEvent["type"],
  { label: string; variant: "warning" | "success" | "info"; dotColor: string }
> = {
  invoice_due: {
    label: "Vencimiento",
    variant: "warning",
    dotColor: "bg-amber-500",
  },
  invoice_issued: {
    label: "Emitida",
    variant: "success",
    dotColor: "bg-teal-500",
  },
  quote_expiry: {
    label: "Presupuesto expira",
    variant: "info",
    dotColor: "bg-blue-500",
  },
};

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

// ─── Calendar helpers ────────────────────────────────────────────────────────

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(month: number, year: number) {
  // Returns 0 = Monday ... 6 = Sunday (ISO week)
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

// ─── Day Cell ────────────────────────────────────────────────────────────────

function DayCell({
  day,
  isToday,
  events,
  isSelected,
  onClick,
}: {
  day: number;
  isToday: boolean;
  events: CalendarEvent[];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-start p-1.5 rounded-lg transition-colors min-h-[60px] md:min-h-[72px]",
        "hover:bg-muted/50",
        isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        isSelected && "bg-primary/10"
      )}
    >
      <span
        className={cn(
          "text-sm font-medium",
          isToday && "text-primary font-bold"
        )}
      >
        {day}
      </span>
      {events.length > 0 && (
        <div className="flex items-center gap-0.5 mt-1 flex-wrap justify-center">
          {events.slice(0, 3).map((event, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                EVENT_CONFIG[event.type]?.dotColor ?? "bg-muted-foreground"
              )}
            />
          ))}
          {events.length > 3 && (
            <span className="text-[8px] text-muted-foreground">
              +{events.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Event List ──────────────────────────────────────────────────────────────

function EventList({ events, day }: { events: CalendarEvent[]; day: number }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Sin eventos para el dia {day}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event, i) => {
        const config = EVENT_CONFIG[event.type];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn("h-2.5 w-2.5 rounded-full shrink-0", config?.dotColor)}
              />
              <div>
                <p className="text-sm font-medium">{event.title}</p>
                <Badge variant={config?.variant ?? "secondary"} className="mt-0.5">
                  {config?.label ?? event.type}
                </Badge>
              </div>
            </div>
            {event.amount != null && (
              <p className="text-sm font-semibold">{formatCurrency(event.amount)}</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function CalendarView() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: events, isLoading } = useCalendarEvents(month, year);
  const eventList: CalendarEvent[] = events ?? [];

  // Group events by day number
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (const event of eventList) {
      const d = new Date(event.date).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(event);
    }
    return map;
  }, [eventList]);

  const daysInMonth = getDaysInMonth(month, year);
  const firstDayOfWeek = getFirstDayOfWeek(month, year);
  const todayDay =
    today.getMonth() + 1 === month && today.getFullYear() === year
      ? today.getDate()
      : -1;

  function prevMonth() {
    setSelectedDay(null);
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    setSelectedDay(null);
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          Calendario
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vencimientos, emisiones y fechas clave de tu facturacion
        </p>
      </div>

      {/* Month navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Desktop grid calendar */}
              <div className="hidden md:block">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="text-center text-xs font-medium text-muted-foreground py-1"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for padding */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    return (
                      <DayCell
                        key={day}
                        day={day}
                        isToday={day === todayDay}
                        events={eventsByDay[day] ?? []}
                        isSelected={day === selectedDay}
                        onClick={() =>
                          setSelectedDay(day === selectedDay ? null : day)
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Mobile list view */}
              <div className="md:hidden space-y-2">
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = eventsByDay[day];
                  if (!dayEvents || dayEvents.length === 0) return null;

                  return (
                    <div key={day} className="border rounded-lg p-3">
                      <p
                        className={cn(
                          "text-sm font-semibold mb-2",
                          day === todayDay && "text-primary"
                        )}
                      >
                        {day} de {MONTH_NAMES[month - 1]}
                        {day === todayDay && " (Hoy)"}
                      </p>
                      {dayEvents.map((event, ei) => {
                        const config = EVENT_CONFIG[event.type];
                        return (
                          <div
                            key={ei}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full shrink-0",
                                  config?.dotColor
                                )}
                              />
                              <span className="text-sm">{event.title}</span>
                            </div>
                            {event.amount != null && (
                              <span className="text-sm font-medium">
                                {formatCurrency(event.amount)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {Object.keys(eventsByDay).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Sin eventos este mes
                  </p>
                )}
              </div>
            </>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t flex-wrap">
            {Object.entries(EVENT_CONFIG).map(([, config]) => (
              <div key={config.label} className="flex items-center gap-1.5">
                <div className={cn("h-2 w-2 rounded-full", config.dotColor)} />
                <span className="text-xs text-muted-foreground">
                  {config.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected day events */}
      {selectedDay != null && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">
              {selectedDay} de {MONTH_NAMES[month - 1]} {year}
            </h3>
            <EventList
              events={eventsByDay[selectedDay] ?? []}
              day={selectedDay}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
