"use client";

import { useState, useMemo } from "react";
import {
  useCalendarEvents,
  useCreateCalendarEntry,
  useUpdateCalendarEntry,
  useDeleteCalendarEntry,
} from "@/hooks/use-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Loader2, Plus, Trash2, CheckCircle2, Circle,
  Clock, CalendarCheck, Bell, FileText, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

// ─── Types ───────────────────────────────────────────────────────────────────

type AutoEventType = "invoice_due" | "invoice_issued" | "quote_expiry";
type CustomEventType = "APPOINTMENT" | "TASK" | "REMINDER";
type EventType = AutoEventType | CustomEventType;

interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  subtitle?: string;
  date: string;
  amount?: number;
  status?: string;
  color?: string;
  done?: boolean;
  readonly?: boolean;
}

const AUTO_STYLE: Record<AutoEventType, { dot: string; bg: string; label: string }> = {
  invoice_due:    { dot: "bg-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",  label: "Vence factura" },
  invoice_issued: { dot: "bg-teal-500",   bg: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800",      label: "Factura emitida" },
  quote_expiry:   { dot: "bg-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800", label: "Caduca pres." },
};

const CUSTOM_STYLE: Record<CustomEventType, { dot: string; bg: string; label: string; icon: React.ReactNode }> = {
  APPOINTMENT: { dot: "bg-violet-500",  bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800", label: "Cita",         icon: <CalendarCheck className="h-3 w-3" /> },
  TASK:        { dot: "bg-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800",         label: "Tarea",        icon: <CheckCircle2 className="h-3 w-3" /> },
  REMINDER:    { dot: "bg-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",     label: "Recordatorio", icon: <Bell className="h-3 w-3" /> },
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(month: number, year: number) {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function eventDot(type: EventType) {
  if (type in AUTO_STYLE) return AUTO_STYLE[type as AutoEventType].dot;
  if (type in CUSTOM_STYLE) return CUSTOM_STYLE[type as CustomEventType].dot;
  return "bg-muted-foreground";
}

// ─── Add/Edit Dialog ─────────────────────────────────────────────────────────

function EntryDialog({
  open,
  onOpenChange,
  initialDate,
  entry,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialDate?: string;
  entry?: CalendarEvent | null;
}) {
  const create = useCreateCalendarEntry();
  const update = useUpdateCalendarEntry();
  const isEdit = !!entry && !entry.readonly;

  const [form, setForm] = useState({
    type: (entry?.type as CustomEventType) ?? "APPOINTMENT",
    title: entry?.title ?? "",
    description: entry?.subtitle ?? "",
    date: entry?.date ?? initialDate ?? new Date().toISOString().slice(0, 10),
  });

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      await update.mutateAsync({ id: entry!.id, ...form });
    } else {
      await create.mutateAsync(form);
    }
    onOpenChange(false);
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {isEdit ? "Editar evento" : "Nuevo evento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {/* Tipo */}
          <div className="grid grid-cols-3 gap-1.5">
            {(["APPOINTMENT", "TASK", "REMINDER"] as CustomEventType[]).map((t) => {
              const s = CUSTOM_STYLE[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-colors",
                    form.type === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-white", s.dot.replace("bg-", "bg-"))}>{s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <Label>Título *</Label>
            <Input
              placeholder={
                form.type === "APPOINTMENT" ? "Reunión con cliente..." :
                form.type === "TASK" ? "Enviar presupuesto..." :
                "Llamar a proveedor..."
              }
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label>Fecha *</Label>
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
          </div>

          <div className="space-y-1">
            <Label>Descripción</Label>
            <Textarea
              placeholder="Detalles adicionales..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEdit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Day Cell ────────────────────────────────────────────────────────────────

function DayCell({
  day, isToday, events, isSelected, onClick,
}: {
  day: number; isToday: boolean; events: CalendarEvent[];
  isSelected: boolean; onClick: () => void;
}) {
  const dots = events.slice(0, 4);
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-start p-1.5 rounded-lg transition-all min-h-[64px] md:min-h-[76px] group",
        "hover:bg-muted/50",
        isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        isSelected && "bg-primary/8"
      )}
    >
      <span className={cn("text-sm font-medium leading-none", isToday && "text-primary font-bold")}>
        {day}
      </span>
      {dots.length > 0 && (
        <div className="flex items-center gap-0.5 mt-1.5 flex-wrap justify-center">
          {dots.map((ev, i) => (
            <div key={i} className={cn("h-1.5 w-1.5 rounded-full", eventDot(ev.type), ev.done && "opacity-40")} />
          ))}
          {events.length > 4 && <span className="text-[8px] text-muted-foreground">+{events.length - 4}</span>}
        </div>
      )}
    </button>
  );
}

// ─── Event Card ──────────────────────────────────────────────────────────────

function EventCard({
  event, onEdit, onDelete, onToggleDone,
}: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
}) {
  const isCustom = !event.readonly;
  const isAuto = event.readonly;

  const autoStyle = isAuto ? AUTO_STYLE[event.type as AutoEventType] : null;
  const customStyle = isCustom ? CUSTOM_STYLE[event.type as CustomEventType] : null;
  const bg = autoStyle?.bg ?? customStyle?.bg ?? "";
  const dot = autoStyle?.dot ?? customStyle?.dot ?? "bg-muted-foreground";
  const label = autoStyle?.label ?? customStyle?.label ?? event.type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("flex items-start justify-between rounded-lg border p-3 gap-3", bg, event.done && "opacity-60")}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {isCustom && event.type === "TASK" ? (
          <button onClick={onToggleDone} className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
            {event.done ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4" />}
          </button>
        ) : (
          <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 mt-1", dot)} />
        )}
        <div className="min-w-0">
          <p className={cn("text-sm font-medium truncate", event.done && "line-through text-muted-foreground")}>{event.title}</p>
          {event.subtitle && <p className="text-xs text-muted-foreground truncate">{event.subtitle}</p>}
          <Badge variant="secondary" className="mt-1 text-[10px] h-4 px-1.5">{label}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {event.amount != null && (
          <p className="text-sm font-semibold mr-1">{formatCurrency(event.amount)}</p>
        )}
        {isCustom && (
          <>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onEdit}>
              <FileText className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Upcoming sidebar ────────────────────────────────────────────────────────

function UpcomingList({ events, onEdit, onDelete, onToggleDone }: {
  events: CalendarEvent[];
  onEdit: (e: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onToggleDone: (e: CalendarEvent) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter((e) => e.date >= today && !e.done)
    .slice(0, 8);

  if (upcoming.length === 0) return (
    <p className="text-xs text-muted-foreground text-center py-4">Sin próximos eventos</p>
  );

  return (
    <div className="space-y-1.5">
      {upcoming.map((ev) => {
        const dot = ev.readonly
          ? AUTO_STYLE[ev.type as AutoEventType]?.dot
          : CUSTOM_STYLE[ev.type as CustomEventType]?.dot;
        const label = ev.readonly
          ? AUTO_STYLE[ev.type as AutoEventType]?.label
          : CUSTOM_STYLE[ev.type as CustomEventType]?.label;
        return (
          <div key={ev.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
            <div className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{ev.title}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(ev.date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · {label}</p>
            </div>
            {ev.amount != null && <span className="text-xs font-medium shrink-0">{formatCurrency(ev.amount)}</span>}
            {!ev.readonly && (
              <button onClick={() => onDelete(ev.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function CalendarView() {
  const t = useTranslations("calendar");
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CalendarEvent | null>(null);

  const { data: events, isLoading } = useCalendarEvents(month, year);
  const deleteEntry = useDeleteCalendarEntry();
  const updateEntry = useUpdateCalendarEntry();
  const eventList: CalendarEvent[] = events ?? [];

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (const event of eventList) {
      const d = new Date(event.date + "T12:00:00").getDate();
      if (!map[d]) map[d] = [];
      map[d].push(event);
    }
    return map;
  }, [eventList]);

  const daysInMonth = getDaysInMonth(month, year);
  const firstDayOfWeek = getFirstDayOfWeek(month, year);
  const todayDay = today.getMonth() + 1 === month && today.getFullYear() === year ? today.getDate() : -1;

  function prevMonth() {
    setSelectedDay(null);
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    setSelectedDay(null);
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const selectedDateStr = selectedDay
    ? `${year}-${String(month).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : undefined;

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  function openCreate() {
    setEditEntry(null);
    setDialogOpen(true);
  }

  function openEdit(ev: CalendarEvent) {
    setEditEntry(ev);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* ── Calendar grid ── */}
        <Card>
          <CardContent className="p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold capitalize">
                {t(`months.${month}`)} {year}
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
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_KEYS.map((key) => (
                    <div key={key} className="text-center text-xs font-medium text-muted-foreground py-1">
                      {t(`days.${key}`)}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    return (
                      <DayCell
                        key={day}
                        day={day}
                        isToday={day === todayDay}
                        events={eventsByDay[day] ?? []}
                        isSelected={day === selectedDay}
                        onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t flex-wrap">
              {Object.entries(AUTO_STYLE).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1">
                  <div className={cn("h-2 w-2 rounded-full", v.dot)} />
                  <span className="text-[10px] text-muted-foreground">{v.label}</span>
                </div>
              ))}
              {Object.entries(CUSTOM_STYLE).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1">
                  <div className={cn("h-2 w-2 rounded-full", v.dot)} />
                  <span className="text-[10px] text-muted-foreground">{v.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          {/* Selected day panel */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {selectedDay
                    ? `${selectedDay} ${t(`months.${month}`)} ${year}`
                    : "Selecciona un día"}
                </CardTitle>
                {selectedDay && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {selectedDay == null ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Haz clic en un día para ver sus eventos
                </p>
              ) : selectedEvents.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">{t("noEventsDay", { day: selectedDay })}</p>
                  <Button size="sm" variant="outline" className="mt-2 gap-1 text-xs h-7" onClick={openCreate}>
                    <Plus className="h-3 w-3" />Añadir evento
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  <div className="space-y-2">
                    {selectedEvents.map((ev) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        onEdit={() => openEdit(ev)}
                        onDelete={() => deleteEntry.mutate(ev.id)}
                        onToggleDone={() => updateEntry.mutate({ id: ev.id, done: !ev.done })}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Próximos eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <UpcomingList
                events={eventList}
                onEdit={openEdit}
                onDelete={(id) => deleteEntry.mutate(id)}
                onToggleDone={(ev) => updateEntry.mutate({ id: ev.id, done: !ev.done })}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog */}
      <EntryDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditEntry(null);
        }}
        initialDate={selectedDateStr}
        entry={editEntry}
      />
    </div>
  );
}
