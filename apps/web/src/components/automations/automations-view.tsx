"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAutomations, useAutomationStats, useCreateAutomation,
  useToggleAutomation, useDeleteAutomation, useUpdateAutomation,
  useTestAutomation, useAutomationLogs,
} from "@/hooks/use-automations";
import { usePlanUsage } from "@/hooks/use-plan";
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
  Pencil, ArrowRight, Lock, Sparkles, FlaskConical,
  ShoppingCart, PackageCheck, AlertTriangle, History,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIGGERS = [
  { value: "INVOICE_CREATED",          label: "Factura creada",              icon: FileText,       color: "text-blue-500" },
  { value: "INVOICE_PAID",             label: "Factura pagada",              icon: CreditCard,     color: "text-emerald-500" },
  { value: "INVOICE_OVERDUE",          label: "Factura vencida",             icon: FileText,       color: "text-destructive" },
  { value: "QUOTE_CREATED",            label: "Presupuesto creado",          icon: FileText,       color: "text-violet-500" },
  { value: "QUOTE_ACCEPTED",           label: "Presupuesto aceptado",        icon: FileText,       color: "text-emerald-500" },
  { value: "LEAD_CREATED",             label: "Nuevo lead",                  icon: Users,          color: "text-amber-500" },
  { value: "DEAL_STAGE_CHANGED",       label: "Deal cambia de etapa",        icon: TrendingUp,     color: "text-purple-500" },
  { value: "CLIENT_CREATED",           label: "Nuevo cliente",               icon: Users,          color: "text-blue-500" },
  { value: "PAYMENT_RECEIVED",         label: "Pago recibido",               icon: CreditCard,     color: "text-emerald-500" },
  { value: "ORDER_CREATED",            label: "Pedido creado",               icon: ShoppingCart,   color: "text-orange-500" },
  { value: "PURCHASE_ORDER_RECEIVED",  label: "Compra recibida en almacén",  icon: PackageCheck,   color: "text-teal-500" },
  { value: "LOW_STOCK",                label: "Stock por debajo del mínimo", icon: AlertTriangle,  color: "text-destructive" },
];

const ACTIONS = [
  { value: "SEND_EMAIL",           label: "Enviar email",               icon: Mail },
  { value: "CREATE_NOTIFICATION",  label: "Crear notificación interna", icon: Bell },
  { value: "SEND_WEBHOOK",         label: "Enviar webhook (HTTP POST)", icon: Globe },
];

const TEMPLATES = [
  {
    name: "Recordatorio de factura vencida",
    description: "Envía un email automático cuando una factura supera la fecha de vencimiento",
    trigger: "INVOICE_OVERDUE",
    action: "SEND_EMAIL",
    actionConfig: {
      subject: "Recordatorio: Factura {{number}} pendiente de pago",
      body: "Estimado {{clientName}},\n\nLe recordamos que su factura {{number}} por importe de {{amount}} está pendiente de pago desde el {{dueDate}}.\n\nSi ya ha realizado el pago, por favor ignore este mensaje.\n\nGracias,\n{{companyName}}",
    },
    emoji: "📩",
  },
  {
    name: "Bienvenida a nuevo cliente",
    description: "Saluda automáticamente a cada cliente nuevo que se da de alta",
    trigger: "CLIENT_CREATED",
    action: "SEND_EMAIL",
    actionConfig: {
      subject: "Bienvenido a {{companyName}}, {{clientName}}",
      body: "Hola {{clientName}},\n\nNos alegra tenerte como cliente. Estamos aquí para ayudarte en lo que necesites.\n\nSaludos,\n{{companyName}}",
    },
    emoji: "👋",
  },
  {
    name: "Alerta de nuevo lead",
    description: "Recibe una notificación interna cada vez que entra un lead nuevo",
    trigger: "LEAD_CREATED",
    action: "CREATE_NOTIFICATION",
    actionConfig: {
      title: "Nuevo lead: {{leadName}}",
      body: "Ha llegado un nuevo lead de {{source}}. Asígnalo a un agente.",
    },
    emoji: "🎯",
  },
  {
    name: "Confirmación de pago recibido",
    description: "Envía un email de confirmación automático al recibir un pago",
    trigger: "PAYMENT_RECEIVED",
    action: "SEND_EMAIL",
    actionConfig: {
      subject: "Pago recibido — Factura {{invoiceNumber}}",
      body: "Estimado {{clientName}},\n\nHemos recibido su pago de {{amount}} correctamente. Gracias por su confianza.\n\nSaludos,\n{{companyName}}",
    },
    emoji: "✅",
  },
  {
    name: "Webhook al aceptar presupuesto",
    description: "Notifica a tu CRM o Zapier cuando un cliente acepta un presupuesto",
    trigger: "QUOTE_ACCEPTED",
    action: "SEND_WEBHOOK",
    actionConfig: { url: "https://hooks.zapier.com/hooks/catch/YOUR_ID" },
    emoji: "🔗",
  },
  {
    name: "Alerta de stock bajo",
    description: "Recibe una notificación interna cuando el stock de un producto cae por debajo del mínimo",
    trigger: "LOW_STOCK",
    action: "CREATE_NOTIFICATION",
    actionConfig: {
      title: "Stock bajo: {{productName}}",
      body: "El producto {{productName}} ({{sku}}) tiene {{currentStock}} unidades, mínimo {{minStock}}.",
    },
    emoji: "⚠️",
  },
  {
    name: "Notificación de nuevo pedido",
    description: "Avisa internamente cuando llega un nuevo pedido de cliente",
    trigger: "ORDER_CREATED",
    action: "CREATE_NOTIFICATION",
    actionConfig: {
      title: "Nuevo pedido: {{orderNumber}}",
      body: "{{clientName}} ha creado el pedido {{orderNumber}} por {{total}} {{currency}}.",
    },
    emoji: "🛒",
  },
  {
    name: "Alerta de compra recibida",
    description: "Notifica cuando una orden de compra queda completamente recibida en almacén",
    trigger: "PURCHASE_ORDER_RECEIVED",
    action: "CREATE_NOTIFICATION",
    actionConfig: {
      title: "OC recibida: {{orderNumber}}",
      body: "La orden {{orderNumber}} de {{supplierName}} ha sido recibida completamente.",
    },
    emoji: "📦",
  },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name:         z.string().min(1, "Nombre obligatorio"),
  description:  z.string().optional(),
  trigger:      z.string().min(1, "Selecciona un trigger"),
  action:       z.string().min(1, "Selecciona una acción"),
  emailSubject: z.string().optional(),
  emailBody:    z.string().optional(),
  notifTitle:   z.string().optional(),
  notifBody:    z.string().optional(),
  webhookUrl:   z.string().url("URL inválida").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

// ─── Automation Dialog (create + edit) ────────────────────────────────────────

function AutomationDialog({
  open, onOpenChange, automation,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  automation?: any; // when provided → edit mode
}) {
  const isEdit = Boolean(automation);
  const create = useCreateAutomation();
  const update = useUpdateAutomation();
  const pending = isEdit ? update.isPending : create.isPending;

  const {
    register, handleSubmit, watch, reset, formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          name:         automation?.name ?? "",
          description:  automation?.description ?? "",
          trigger:      automation?.trigger ?? "",
          action:       automation?.action ?? "SEND_EMAIL",
          emailSubject: automation?.actionConfig?.subject ?? "",
          emailBody:    automation?.actionConfig?.body ?? "",
          notifTitle:   automation?.actionConfig?.title ?? "",
          notifBody:    automation?.actionConfig?.body ?? "",
          webhookUrl:   automation?.actionConfig?.url ?? "",
        }
      : { trigger: "", action: "SEND_EMAIL" },
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

    const payload = {
      name: data.name, description: data.description,
      trigger: data.trigger, action: data.action, actionConfig,
    };

    if (isEdit) {
      await update.mutateAsync({ id: automation.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {isEdit ? "Editar automatización" : "Nueva automatización"}
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

          {selectedAction === "SEND_EMAIL" && (
            <div className="space-y-3 rounded-lg bg-muted/30 p-3 border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Config del email</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Asunto</Label>
                <Input className="h-9 text-sm" {...register("emailSubject")} placeholder="Factura {{number}} pendiente de pago" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cuerpo</Label>
                <textarea
                  {...register("emailBody")}
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Estimado {{clientName}}, su factura vence el {{dueDate}}..."
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Variables: <code className="bg-muted px-1 rounded">{"{{clientName}}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{{number}}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{{amount}}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{{dueDate}}"}</code>
              </p>
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
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEdit ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── AutomationCard ───────────────────────────────────────────────────────────

function AutomationCard({
  automation, onEdit,
}: { automation: any; onEdit: (a: any) => void }) {
  const toggle = useToggleAutomation();
  const remove = useDeleteAutomation();
  const test   = useTestAutomation();

  const trigger = TRIGGERS.find((t) => t.value === automation.trigger);
  const action  = ACTIONS.find((a) => a.value === automation.action);
  const TriggerIcon = trigger?.icon ?? Zap;
  const ActionIcon  = action?.icon ?? Zap;

  return (
    <Card className={cn("transition-all", !automation.isActive && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn(
                "h-2 w-2 rounded-full shrink-0",
                automation.isActive ? "bg-emerald-500" : "bg-muted-foreground"
              )} />
              <p className="font-semibold text-sm truncate">{automation.name}</p>
            </div>
            {automation.description && (
              <p className="text-xs text-muted-foreground mb-3">{automation.description}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5">
                <TriggerIcon className={cn("h-3.5 w-3.5", trigger?.color ?? "text-muted-foreground")} />
                <span className="text-xs font-medium">{trigger?.label ?? automation.trigger}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
              onClick={() => onEdit(automation)} title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-violet-500"
              onClick={() => test.mutate(automation.id)}
              disabled={test.isPending}
              title="Probar ahora"
            >
              {test.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <FlaskConical className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => toggle.mutate(automation.id)}
              title={automation.isActive ? "Pausar" : "Activar"}
            >
              {automation.isActive
                ? <Pause className="h-4 w-4 text-amber-500" />
                : <Play className="h-4 w-4 text-emerald-500" />}
            </Button>
            <Button
              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
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

// ─── Plan Upgrade Wall ────────────────────────────────────────────────────────

function PlanUpgradeWall() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mb-6">
        <Lock className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-2">Las automatizaciones son de pago</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Con el plan <strong>FREE</strong> no puedes crear automatizaciones.
        Actualiza a <strong>STARTER o superior</strong> para desbloquear flujos
        automáticos de email, notificaciones y webhooks.
      </p>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <a href="/billing">Ver planes</a>
        </Button>
        <Button asChild>
          <a href="/billing?upgrade=starter">Actualizar a Starter</a>
        </Button>
      </div>
    </div>
  );
}

// ─── Templates Section ────────────────────────────────────────────────────────

function TemplatesSection({ onApply }: { onApply: (tpl: typeof TEMPLATES[number]) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Plantillas rápidas</h2>
        <span className="text-xs text-muted-foreground">— haz clic para usar</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.name}
            onClick={() => onApply(tpl)}
            className="text-left rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all p-4 group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{tpl.emoji}</span>
              <div>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">{tpl.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tpl.description}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 font-medium">
                    {TRIGGERS.find((t) => t.value === tpl.trigger)?.label ?? tpl.trigger}
                  </span>
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">
                    {ACTIONS.find((a) => a.value === tpl.action)?.label ?? tpl.action}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Execution Logs ───────────────────────────────────────────────────────────

function ExecutionLogs() {
  const [expanded, setExpanded] = useState(false);
  const { data: logs, isLoading } = useAutomationLogs();

  const list = logs ?? [];

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Historial de ejecuciones</span>
          {list.length > 0 && (
            <span className="text-xs bg-muted rounded-full px-2 py-0.5">{list.length}</span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="divide-y max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Sin ejecuciones registradas todavía
            </div>
          ) : (
            list.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                {log.success
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{log.automation?.name ?? "—"}</span>
                    <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
                      {TRIGGERS.find((t) => t.value === log.trigger)?.label ?? log.trigger}
                    </span>
                    {(log.payload as any)?._test && (
                      <span className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded px-1.5 py-0.5">TEST</span>
                    )}
                  </div>
                  {log.errorMessage && (
                    <p className="text-xs text-destructive mt-0.5 truncate">{log.errorMessage}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function AutomationsView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);

  const { data: automations, isLoading } = useAutomations();
  const { data: stats }    = useAutomationStats();
  const { data: planUsage } = usePlanUsage();
  const create = useCreateAutomation();

  const list: any[] = automations ?? [];
  const maxAutomations = planUsage?.limits?.maxAutomations ?? -1;
  const isBlocked = maxAutomations === 0; // FREE plan

  function openEdit(automation: any) {
    setEditingAutomation(automation);
    setDialogOpen(true);
  }

  function openCreate() {
    setEditingAutomation(null);
    setDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingAutomation(null);
  }

  async function applyTemplate(tpl: typeof TEMPLATES[number]) {
    await create.mutateAsync({
      name: tpl.name,
      description: tpl.description,
      trigger: tpl.trigger,
      action: tpl.action,
      actionConfig: tpl.actionConfig,
    });
  }

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
        {!isBlocked && (
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva regla
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total reglas",      value: stats?.total    ?? 0 },
          { label: "Activas",           value: stats?.active   ?? 0 },
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

      {/* Plan blocked */}
      {isBlocked ? (
        <PlanUpgradeWall />
      ) : (
        <>
          {/* Templates (only when list is empty) */}
          {!isLoading && list.length === 0 && (
            <TemplatesSection onApply={applyTemplate} />
          )}

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">Sin automatizaciones</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Elige una plantilla de arriba o crea una regla personalizada
                desde cero.
              </p>
              <Button className="mt-6 gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Crear desde cero
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
                  <AutomationCard automation={automation} onEdit={openEdit} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Templates always visible at bottom when there ARE automations */}
          {!isLoading && list.length > 0 && (
            <TemplatesSection onApply={applyTemplate} />
          )}

          {/* Execution logs */}
          {!isLoading && <ExecutionLogs />}
        </>
      )}

      <AutomationDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        automation={editingAutomation}
      />
    </div>
  );
}
