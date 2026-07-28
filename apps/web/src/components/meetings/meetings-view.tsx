"use client";

import { useState } from "react";
import { useMeetings, useDeleteMeeting, type Meeting } from "@/hooks/use-meetings";
import { MeetingDialog } from "./meeting-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Search, Users, MapPin, Calendar, FileText,
  AlertCircle, Pencil, Trash2, ChevronDown, ChevronUp,
  Share2, CheckCircle2, Clock, XCircle, PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG = {
  SCHEDULED:   { label: "Programada",  icon: Clock,        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  IN_PROGRESS: { label: "En curso",    icon: PlayCircle,   color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  COMPLETED:   { label: "Completada",  icon: CheckCircle2, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  CANCELLED:   { label: "Cancelada",   icon: XCircle,      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
} as const;

function MeetingCard({ meeting, onEdit, onDelete }: { meeting: Meeting; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[meeting.status] ?? STATUS_CONFIG.SCHEDULED;
  const StatusIcon = cfg.icon;

  function copyShareLink() {
    const url = `${window.location.origin}/reuniones/${meeting.id}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{meeting.title}</h3>
              <Badge className={cn("text-xs shrink-0", cfg.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {cfg.label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(meeting.date), "d MMM yyyy", { locale: es })}
                {meeting.endDate && ` — ${format(new Date(meeting.endDate), "d MMM yyyy", { locale: es })}`}
              </span>
              {meeting.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {meeting.location}
                </span>
              )}
              {meeting.participants.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {meeting.participants.length} participante{meeting.participants.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {meeting.participants.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {meeting.participants.slice(0, 5).map((p) => (
                  <Badge key={p} variant="outline" className="text-xs py-0">{p}</Badge>
                ))}
                {meeting.participants.length > 5 && (
                  <Badge variant="outline" className="text-xs py-0">+{meeting.participants.length - 5}</Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyShareLink} title="Copiar enlace">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-4">
            {meeting.agenda && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <FileText className="h-3 w-3" /> Orden del día
                </p>
                <p className="text-sm whitespace-pre-wrap">{meeting.agenda}</p>
              </div>
            )}
            {meeting.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <FileText className="h-3 w-3" /> Acta / Notas
                </p>
                <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3">{meeting.notes}</p>
              </div>
            )}
            {meeting.diagnosis && (
              <div>
                <p className="text-xs font-medium text-amber-600 flex items-center gap-1 mb-1">
                  <AlertCircle className="h-3 w-3" /> Diagnóstico del problema
                </p>
                <p className="text-sm whitespace-pre-wrap bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">{meeting.diagnosis}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MeetingsView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useMeetings({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });
  const deleteMeeting = useDeleteMeeting();

  function handleEdit(m: Meeting) {
    setEditMeeting(m);
    setDialogOpen(true);
  }

  function handleNew() {
    setEditMeeting(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Reuniones y Actas</h2>
          <p className="text-xs text-muted-foreground">Gestiona reuniones de equipo y clientes, actas y diagnósticos</p>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Nueva reunión
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar reuniones..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="SCHEDULED">Programadas</SelectItem>
            <SelectItem value="IN_PROGRESS">En curso</SelectItem>
            <SelectItem value="COMPLETED">Completadas</SelectItem>
            <SelectItem value="CANCELLED">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No hay reuniones</p>
          <p className="text-sm text-muted-foreground mt-1">Crea la primera reunión o acta de tu equipo</p>
          <Button className="mt-4" size="sm" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1.5" /> Nueva reunión
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onEdit={() => handleEdit(m)}
              onDelete={() => setDeleteId(m.id)}
            />
          ))}
        </div>
      )}

      <MeetingDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditMeeting(null); }}
        meeting={editMeeting}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reunión?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => { if (deleteId) { await deleteMeeting.mutateAsync(deleteId); setDeleteId(null); } }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
