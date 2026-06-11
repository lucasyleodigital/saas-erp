"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAutomations, useAutomationStats, useCreateAutomation,
  useToggleAutomation, useDeleteAutomation,
} from "@/hooks/use-automations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Zap, Plus, Trash2, Play, Pause, Mail, Bell, Globe,
  FileText, Users, TrendingUp, CreditCard, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

const TRIGGERS = [
  { value: "INVOICE_CREATED", label: "Factura creada", icon: FileText, color: "text-blue-500" },
  { value: "INVOICE_PAID", label: "Factura pagada", icon: CreditCard, color: "text-emerald-500" },
  { value: "INVOICE_OVERDUE", label: "Factura vencida", icon: FileText, color: "text-destructive" },
  { value: "QUOTE_CREATED", label: "Presupuesto creado", icon: FileText, color: "text-violet-500" },
  { value: "QUOTE_ACCEPTED", label: "Presupuesto aceptado", icon: FileText, color: "text-emerald-500" },
  { value: "LEAD_CREATED", label: "Nuevo lead", icon: Users, color: "text-amber-500" },
  { value: "DEAL_STAGE_CHANGED", label: "Deal cambia de etapa", icon: TrendingUp, color: "text-purple-500" },
  { value: "CLIENT_CREATED", label: "Nuevo cliente", icon: Users, color: "text-blue-500" },
  { value: "PAYMENT_RECEIVED", label: "Pago recibido", icon: CreditCard, color: "text-emerald-500" },
];

const ACTIONS = [
  { value: "SEND_EMAIL", label: "Enviar email", icon: Mail },
  { value: "CREATE_NOTIFICATION", label: "Crear notificación interna", icon: Bell },
  { value: "SEND_WEBHOOK", label: "Enviar webhook (HTTP POST)", icon: Globe },
];

const schema = z.object({
  name: z.string().min(1, "Nombre obligatorio"),
  description: z.string().optional(),
  trigger: z.string().min(1, "Selecciona un trigger"),
  action: z.string().min(1, "Selecciona una acción"),
  // action-specific
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  notifTitle: z.string().optional(),
  notifBody: z.string().optional(),
  webhookUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

function AutomationDialog({
  open, onOpenChange,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const create = useCreateAutomation();
  const {
    register, handleSubmit, watch, reset, formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { trigger: "", action: "SEND_EMAIL" },
  });
  const selectedAction = watch("action");

  async function onSubmit(data: FormData) {
    let actionConfig: Record<string, string> = {};
    if (data.action === "SEND_EMAIL") {
      actionConfig = { subject: data.emailSubject ?? "", body: data.emailBody ?? "" };
    } else if (data.action === "CREATE_NOTIFICATION") {
      actionConfig = { title: data.notifTitle ?? "", body: data.notifBody ?? "" };
    } else if (data.action === "SEND_WEBHOOK") {
      actionConfig = { url: data.webhookUrl ?? "" };
    }
    await create.mutateAsync({
      name: data.name,
      description: data.description,
      trigger: data.trigger,
      action: data.action,
      actionConfig,
    });
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Nueva automatización
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input {...register("name")} placeholder="Recordatorio de pago" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input {...register("description")} placeholder="Opcional..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cuando ocurra esto (trigger) *</Label>
            <select
              {...register("trigger")}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Seleccionar evento...</option>
              {TRIGGERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.trigger && <p className="text-xs text-destructive">{errors.trigger.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Ejecutar esta acción *</Label>
            <select
              {...register("action")}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Dynamic action config */}
          {selectedAction === "SEND_EMAIL" && (
            <div className="space-y-3 rounded-lg bg-muted/30 p-3 border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Config del email</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Asunto</Label>
                <Input className="h-9 text-sm" {...register("emailSubject")} placeholder="Factura {{number}} pendiente de pago" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cuerpo</Label>
                <Input className="h-9 text-sm" {...register("emailBody")} placeholder="Estimado {{clientName}}, su factura vence el {{dueDate}}..." />
              </div>
              <p className="text-xs text-muted-foreground">Usa <code className="bg-muted px-1 rounded">{"{{variable}}"}</code> para insertar datos dinámicos</p>
            </div>
          )}

          {selectedAction === "CREATE_NOTIFICATION" && (
            <div className="space-y-3 rounded-lg bg-muted/30 p-3 border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Config de notificación</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Título</Label>
                <Input className="h-9 text-sm" {...register("notifTitle")} placeholder="Nueva factura creada" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mensaje</Label>
                <Input className="h-9 text-sm" {...register("notifBody")} placeholder="Se ha creado la factura {{number}}" />
              </div>
            </div>
          )}

          {selectedAction === "SEND_WEBHOOK" && (
            <div className="space-y-3 rounded-lg bg-muted/30 p-3 border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Config del webhook</p>
              <div className="space-y-1.5">
                <Label className="text-xs">URL (POST)</Label>
                <Input className="h-9 text-sm" {...register("webhookUrl")} placeholder="https://hooks.zapier.com/..." />
                {errors.webhookUrl && <p className="text-xs text-destructive">{errors.webhookUrl.message}</p>}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AutomationCard({ automation }: { automation: any }) {
  const toggle = useToggleAutomation();
  const remove = useDeleteAutomation();

  const trigger = TRIGGERS.find((t) => t.value === automation.trigger);
  const action = ACTIONS.find((a) => a.value === automation.action);
  const TriggerIcon = trigger?.icon ?? Zap;
  const ActionIcon = action?.icon ?? Zap;

  return (
    <Card className={cn(
      "transition-all",
      !automation.isActive && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn(
                "h-2 w-2 rounded-full",
                automation.isActive ? "bg-emerald-500" : "bg-muted-foreground"
              )} />
              <p className="font-semibold text-sm truncate">{automation.name}</p>
            </div>
            {automation.description && (
              <p className="text-xs text-muted-foreground mb-3">{automation.description}</p>
            )}

            {/* Flow visualization */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5">
                <TriggerIcon className={cn("h-3.5 w-3.5", trigger?.color ?? "text-muted-foreground")} />
                <span className="text-xs font-medium">{trigger?.label ?? automation.trigger}</span>
              </div>
              <span className="text-muted-foreground text-xs">→</span>
              <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-2.5 py-1.5">
                <ActionIcon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">{action?.label ?? automation.action}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {automation.runCount > 0
                ? `Ejecutada ${automation.runCount} vez${automation.runCount !== 1 ? "es" : ""}`
                : "Sin ejecuciones aún"}
              {automation.lastRunAt && ` · Última: ${new Date(automation.lastRunAt).toLocaleDateString("es-ES")}`}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toggle.mutate(automation.id)}
              title={automation.isActive ? "Pausar" : "Activar"}
            >
              {automation.isActive
                ? <Pause className="h-4 w-4 text-amber-500" />
                : <Play className="h-4 w-4 text-emerald-500" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => remove.mutate(automation.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AutomationsView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: automations, isLoading } = useAutomations();
  const { data: stats } = useAutomationStats();
  const list: any[] = automations ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automatizaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reglas automáticas que trabajan por ti 24/7
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva regla
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total reglas", value: stats?.total ?? 0 },
          { label: "Activas", value: stats?.active ?? 0 },
          { label: "Ejecuciones totales", value: stats?.totalRuns ?? 0 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <p className="font-semibold text-lg">Sin automatizaciones</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Crea tu primera regla y deja que el sistema trabaje solo — envío de emails,
            notificaciones, webhooks y más.
          </p>
          <Button className="mt-6 gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Crear primera regla
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((automation, i) => (
            <motion.div
              key={automation.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <AutomationCard automation={automation} />
            </motion.div>
          ))}
        </div>
      )}

      <AutomationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
