"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus, Users, MapPin, Calendar, Clock, FileText, AlertCircle } from "lucide-react";
import { useCreateMeeting, useUpdateMeeting, type Meeting } from "@/hooks/use-meetings";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meeting?: Meeting | null;
  defaultDate?: string;
}

type MeetingStatus = Meeting["status"];

interface FormState {
  title: string;
  date: string;
  endDate: string;
  location: string;
  participants: string[];
  agenda: string;
  notes: string;
  diagnosis: string;
  status: MeetingStatus;
}

const STATUS_OPTIONS: { value: MeetingStatus; label: string }[] = [
  { value: "SCHEDULED",   label: "Programada" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "COMPLETED",   label: "Completada" },
  { value: "CANCELLED",   label: "Cancelada" },
];

const DEFAULT_FORM: FormState = {
  title: "",
  date: new Date().toISOString().slice(0, 10),
  endDate: "",
  location: "",
  participants: [],
  agenda: "",
  notes: "",
  diagnosis: "",
  status: "SCHEDULED",
};

function ParticipantInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  function add() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Nombre o email..."
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1">
              {p}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== p))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function MeetingDialog({ open, onOpenChange, meeting, defaultDate }: Props) {
  const create = useCreateMeeting();
  const update = useUpdateMeeting();
  const isEdit = !!meeting;

  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM, date: defaultDate ?? DEFAULT_FORM.date });

  useEffect(() => {
    if (meeting) {
      setForm({
        title: meeting.title,
        date: meeting.date.slice(0, 10),
        endDate: meeting.endDate ? (meeting.endDate as string).slice(0, 10) : "",
        location: meeting.location ?? "",
        participants: meeting.participants ?? [],
        agenda: meeting.agenda ?? "",
        notes: meeting.notes ?? "",
        diagnosis: meeting.diagnosis ?? "",
        status: meeting.status,
      });
    } else {
      setForm({ ...DEFAULT_FORM, date: defaultDate ?? DEFAULT_FORM.date });
    }
  }, [meeting, defaultDate, open]);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date) return;

    const payload: Partial<Meeting> = {
      title: form.title,
      date: form.date,
      endDate: form.endDate || undefined,
      location: form.location || undefined,
      participants: form.participants,
      agenda: form.agenda || undefined,
      notes: form.notes || undefined,
      diagnosis: form.diagnosis || undefined,
      status: form.status,
    };

    if (isEdit) {
      await update.mutateAsync({ id: meeting!.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar reunión" : "Nueva reunión / acta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Título + Estado */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ej: Reunión semanal de equipo" required />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as MeetingStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Fecha *</Label>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Fecha fin</Label>
              <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Lugar / Enlace</Label>
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Sala A, Zoom, Google Meet..." />
          </div>

          {/* Participantes */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Participantes</Label>
            <ParticipantInput value={form.participants} onChange={(v) => set("participants", v)} />
          </div>

          {/* Orden del día */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Orden del día</Label>
            <Textarea value={form.agenda} onChange={(e) => set("agenda", e.target.value)} placeholder="Puntos a tratar en la reunión..." rows={3} />
          </div>

          {/* Notas / Acta */}
          <div className="space-y-1.5">
            <Label>Notas / Acta de la reunión</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Resumen de lo tratado, acuerdos, próximos pasos..." rows={4} />
          </div>

          {/* Diagnóstico */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              Diagnóstico del problema
            </Label>
            <Textarea
              value={form.diagnosis}
              onChange={(e) => set("diagnosis", e.target.value)}
              placeholder="Descripción del problema detectado, causa raíz, impacto..."
              rows={3}
              className="border-amber-200 focus-visible:ring-amber-400"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isEdit ? "Guardar cambios" : "Crear reunión"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
