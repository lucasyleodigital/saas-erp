"use client";

import { useState } from "react";
import { useShipments, useCreateShipment, useAnularShipment } from "@/hooks/use-shipments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Truck,
  Plus,
  Loader2,
  ExternalLink,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── New Shipment Form ────────────────────────────────────────────────────────

function NewShipmentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const create = useCreateShipment();
  const [form, setForm] = useState({
    referencia: "",
    transportistaNombre: "",
    transportistaNif: "",
    origen: "",
    destino: "",
    naturalezaCarga: "",
    pesoKg: "",
    matricula: "",
    fechaRecogida: "",
    horarioRecogida: "",
    fechaEntrega: "",
    horarioEntrega: "",
    palets: "",
    metrosLineales: "",
  });

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, any> = {
      transportistaNombre: form.transportistaNombre,
      transportistaNif: form.transportistaNif,
      origen: form.origen,
      destino: form.destino,
      naturalezaCarga: form.naturalezaCarga,
      pesoKg: parseFloat(form.pesoKg),
      matricula: form.matricula,
    };
    if (form.referencia) payload.referencia = form.referencia;
    if (form.fechaRecogida) payload.fechaRecogida = form.fechaRecogida;
    if (form.horarioRecogida) payload.horarioRecogida = form.horarioRecogida;
    if (form.fechaEntrega) payload.fechaEntrega = form.fechaEntrega;
    if (form.horarioEntrega) payload.horarioEntrega = form.horarioEntrega;
    if (form.palets) payload.palets = parseInt(form.palets);
    if (form.metrosLineales) payload.metrosLineales = parseFloat(form.metrosLineales);

    await create.mutateAsync(payload);
    onOpenChange(false);
    setForm({
      referencia: "", transportistaNombre: "", transportistaNif: "",
      origen: "", destino: "", naturalezaCarga: "", pesoKg: "", matricula: "",
      fechaRecogida: "", horarioRecogida: "", fechaEntrega: "", horarioEntrega: "",
      palets: "", metrosLineales: "",
    });
  }

  const Field = ({
    label, id, required, type = "text", placeholder,
  }: { label: string; id: keyof typeof form; required?: boolean; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}{required && " *"}</Label>
      <Input
        id={id}
        type={type}
        value={form[id]}
        onChange={(e) => set(id, e.target.value)}
        placeholder={placeholder}
        required={required}
        step={type === "number" ? "any" : undefined}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Nuevo envío — Generar DeCA
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Datos del cargador
            </p>
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              Se usarán el nombre y CIF configurados en los datos de empresa.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Transportista
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre / razón social" id="transportistaNombre" required placeholder="Transportes Ejemplo SL" />
              <Field label="NIF / CIF" id="transportistaNif" required placeholder="B12345678" />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Transporte
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Origen" id="origen" required placeholder="Calle Mayor 1, Amposta" />
              <Field label="Destino" id="destino" required placeholder="Mercabarna, Barcelona" />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <Field label="Naturaleza de la carga" id="naturalezaCarga" required placeholder="Hortalizas" />
              <Field label="Peso (kg)" id="pesoKg" required type="number" placeholder="1500" />
              <Field label="Matrícula" id="matricula" required placeholder="1234ABC" />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Datos opcionales
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Referencia propia" id="referencia" placeholder="PED-0001" />
              <Field label="Palets" id="palets" type="number" placeholder="12" />
              <Field label="Metros lineales" id="metrosLineales" type="number" placeholder="6" />
              <div />
              <Field label="Fecha de recogida" id="fechaRecogida" type="date" />
              <Field label="Horario de recogida" id="horarioRecogida" placeholder="08:00-10:00" />
              <Field label="Fecha de entrega" id="fechaEntrega" type="date" />
              <Field label="Horario de entrega" id="horarioEntrega" placeholder="14:00-16:00" />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending} className="gap-2">
              {create.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando DeCA...</>
                : <><FileText className="h-4 w-4" /> Generar DeCA</>
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string | null }) {
  if (estado === "vigente") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5">
        <CheckCircle className="h-3 w-3" /> Vigente
      </span>
    );
  }
  if (estado === "anulado") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 rounded-full px-2 py-0.5">
        <XCircle className="h-3 w-3" /> Anulado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
      <Clock className="h-3 w-3" /> Pendiente
    </span>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function ShipmentsView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useShipments();
  const anular = useAnularShipment();

  const shipments: any[] = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Envíos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Genera y gestiona los Documentos de Control de Transporte (DeCA).
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo envío
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <p className="font-semibold text-lg">Ningún envío todavía</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Genera el primer Documento de Control de Transporte para tus envíos.
          </p>
          <Button className="mt-6 gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo envío
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              {data?.total ?? shipments.length} envíos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Referencia</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Transportista</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Origen → Destino</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Carga</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">DeCA</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {shipments.map((s: any, i: number) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {s.referencia ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[160px]">{s.transportistaNombre}</p>
                      <p className="text-xs text-muted-foreground">{s.transportistaNif}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                      <p className="truncate">{s.origen}</p>
                      <p className="truncate text-foreground/70">→ {s.destino}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <p className="truncate max-w-[120px]">{s.naturalezaCarga}</p>
                      <p>{s.pesoKg} kg{s.palets ? ` · ${s.palets} pal.` : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <EstadoBadge estado={s.decaflyEstado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.decaflyVerifyUrl ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={s.decaflyVerifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Ver <ExternalLink className="h-3 w-3" />
                          </a>
                          <span className="text-muted-foreground">·</span>
                          <a
                            href={s.decaflyPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            PDF <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin DeCA</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      {s.decaflyEstado === "vigente" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("¿Anular este DeCA? No se puede deshacer.")) {
                              anular.mutate(s.id);
                            }
                          }}
                          disabled={anular.isPending}
                        >
                          Anular
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <NewShipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
