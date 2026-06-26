"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { LocaleLink } from "@/components/ui/locale-link";
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
import { useTranslations } from "next-intl";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIGGERS = [
  { value: "INVOICE_CREATED",          label: "triggers.invoiceCreated",     icon: FileText,       color: "text-blue-500" },
  { value: "INVOICE_PAID",             label: "triggers.invoicePaid",        icon: CreditCard,     color: "text-emerald-500" },
  { value: "INVOICE_OVERDUE",          label: "triggers.invoiceOverdue",     icon: FileText,       color: "text-destructive" },
  { value: "QUOTE_CREATED",            label: "triggers.quoteCreated",       icon: FileText,       color: "text-violet-500" },
  { value: "QUOTE_ACCEPTED",           label: "triggers.quoteAccepted",      icon: FileText,       color: "text-emerald-500" },
  { value: "LEAD_CREATED",             label: "triggers.leadCreated",        icon: Users,          color: "text-amber-500" },
  { value: "DEAL_STAGE_CHANGED",       label: "triggers.dealStageChanged",   icon: TrendingUp,     color: "text-purple-500" },
  { value: "CLIENT_CREATED",           label: "triggers.clientCreated",      icon: Users,          color: "text-blue-500" },
  { value: "PAYMENT_RECEIVED",         label: "triggers.paymentReceived",    icon: CreditCard,     color: "text-emerald-500" },
  { value: "ORDER_CREATED",            label: "triggers.orderCreated",       icon: ShoppingCart,   color: "text-orange-500" },
  { value: "PURCHASE_ORDER_RECEIVED",  label: "triggers.purchaseReceived",   icon: PackageCheck,   color: "text-teal-500" },
  { value: "LOW_STOCK",                label: "triggers.lowStock",           icon: AlertTriangle,  color: "text-destructive" },
];

const ACTIONS = [
  { value: "SEND_EMAIL",           label: "actions.sendEmail",          icon: Mail },
  { value: "CREATE_NOTIFICATION",  label: "actions.createNotification", icon: Bell },
  { value: "SEND_WEBHOOK",         label: "actions.sendWebhook",        icon: Globe },
];

const TEMPLATES = [
  {
    name: "templates.overdueReminder.name",
    description: "templates.overdueReminder.description",
    trigger: "INVOICE_OVERDUE",
    action: "SEND_EMAIL",
    actionConfig: {
      subject: "Recordatorio: Factura {{number}} pendiente de pago",
      body: "Estimado {{clientName}},\n\nLe recordamos que su factura {{number}} por importe de {{amount}} está pendiente de pago desde el {{dueDate}}.\n\nSi ya ha realizado el pago, por favor ignore este mensaje.\n\nGracias,\n{{companyName}}",
    },
    emoji: "📩",
  },
  {
    name: "templates.welcomeClient.name",
    description: "templates.welcomeClient.description",
    trigger: "CLIENT_CREATED",
    action: "SEND_EMAIL",
    actionConfig: {
      subject: "Bienvenido a {{companyName}}, {{clientName}}",
      body: "Hola {{clientName}},\n\nNos alegra tenerte como cliente. Estamos aquí para ayudarte en lo que necesites.\n\nSaludos,\n{{companyName}}",
    },
    emoji: "👋",
  },
  {
    name: "templates.newLeadAlert.name",
    description: "templates.newLeadAlert.description",
    trigger: "LEAD_CREATED",
    action: "CREATE_NOTIFICATION",
    actionConfig: {
      title: "Nuevo lead: {{leadName}}",
      body: "Ha llegado un nuevo lead de {{source}}. Asígnalo a un agente.",
    },
    emoji: "🎯",
  },
  {
    name: "templates.paymentConfirmation.name",
    description: "templates.paymentConfirmation.description",
    trigger: "PAYMENT_RECEIVED",
    action: "SEND_EMAIL",
    actionConfig: {
      subject: "Pago recibido — Factura {{invoiceNumber}}",
      body: "Estimado {{clientName}},\n\nHemos recibido su pago de {{amount}} correctamente. Gracias por su confianza.\n\nSaludos,\n{{companyName}}",
    },
    emoji: "✅",
  },
  {
    name: "templates.quoteWebhook.name",
    description: "templates.quoteWebhook.description",
    trigger: "QUOTE_ACCEPTED",
    action: "SEND_WEBHOOK",
    actionConfig: { url: "https://hooks.zapier.com/hooks/catch/YOUR_ID" },
    emoji: "🔗",
  },
  {
    name: "templates.lowStockAlert.name",
    description: "templates.lowStockAlert.description",
    trigger: "LOW_STOCK",
    action: "CREATE_NOTIFICATION",
    actionConfig: {
      title: "Stock bajo: {{productName}}",
      body: "El producto {{productName}} ({{sku}}) tiene {{currentStock}} unidades, mínimo {{minStock}}.",
    },
    emoji: "⚠️",
  },
  {
    name: "templates.newOrderNotif.name",
    description: "templates.newOrderNotif.description",
    trigger: "ORDER_CREATED",
    action: "CREATE_NOTIFICATION",
    actionConfig: {
      title: "Nuevo pedido: {{orderNumber}}",
      body: "{{clientName}} ha creado el pedido {{orderNumber}} por {{total}} {{currency}}.",
    },
    emoji: "🛒",
  },
  {
    name: "templates.purchaseReceivedAlert.name",
    description: "templates.purchaseReceivedAlert.description",
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
  name:         z.string().min(1, "form.nameRequired"),
  description:  z.string().optional(),
  trigger:      z.string().min(1, "form.selectTrigger"),
  action:       z.string().min(1, "form.selectAction"),
  emailSubject: z.string().optional(),
  emailBody:    z.string().optional(),
  notifTitle:   z.string().optional(),
  notifBody:    z.string().optional(),
  webhookUrl:   z.string().url("form.invalidUrl").optional().or(z.literal("")),
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
  const t = useTranslations("automations");
  const tCommon = useTranslations("common");
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
            {isEdit ? t("form.editTitle") : t("form.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{tCommon("name")} *</Label>
              <Input {...register("name")} placeholder={t("form.namePlaceholder")} />
              {errors.name && <p className="text-xs text-destructive">{t(errors.name.message!)}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{tCommon("description")}</Label>
              <Input {...register("description")} placeholder={tCommon("optional")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("form.triggerLabel")}</Label>
            <select
              {...register("trigger")}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t("form.selectEvent")}</option>
              {TRIGGERS.map((tr) => (
                <option key={tr.value} value={tr.value}>{t(tr.label)}</option>
              ))}
            </select>
            {errors.trigger && <p className="text-xs text-destructive">{t(errors.trigger.message!)}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{t("form.actionLabel")}</Label>
            <select
              {...register("action")}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ACTIONS.map((act) => (
                <option key={act.value} value={act.value}>{t(act.label)}</option>
              ))}
            </select>
          </div>

          {selectedAction === "SEND_EMAIL" && (
            <div className="space-y-3 rounded-lg bg-muted/30 p-3 border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("form.emailConfig")}</p>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("form.subject")}</Label>
                <Input className="h-9 text-sm" {...register("emailSubject")} placeholder="Factura {{number}} pendiente de pago" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("form.body")}</Label>
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("form.notifConfig")}</p>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("form.notifTitleLabel")}</Label>
                <Input className="h-9 text-sm" {...register("notifTitle")} placeholder="Nueva factura creada" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("form.message")}</Label>
                <Input className="h-9 text-sm" {...register("notifBody")} placeholder="Se ha creado la factura {{number}}" />
              </div>
            </div>
          )}

          {selectedAction === "SEND_WEBHOOK" && (
            <div className="space-y-3 rounded-lg bg-muted/30 p-3 border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("form.webhookConfig")}</p>
              <div className="space-y-1.5">
                <Label className="text-xs">URL (POST)</Label>
                <Input className="h-9 text-sm" {...register("webhookUrl")} placeholder="https://hooks.zapier.com/..." />
                {errors.webhookUrl && <p className="text-xs text-destructive">{t(errors.webhookUrl.message!)}</p>}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEdit ? tCommon("save") : tCommon("create")}
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
  const t = useTranslations("automations");
  const tCommon = useTranslations("common");
  const toggle = useToggleAutomation();
  const remove = useDeleteAutomation();
  const test   = useTestAutomation();

  const trigger = TRIGGERS.find((tr) => tr.value === automation.trigger);
  const action  = ACTIONS.find((act) => act.value === automation.action);
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
                <span className="text-xs font-medium">{trigger ? t(trigger.label) : automation.trigger}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-2.5 py-1.5">
                <ActionIcon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">{action ? t(action.label) : automation.action}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {automation.runCount > 0
                ? t("stats.executedCount", { count: automation.runCount })
                : t("stats.noExecutions")}
              {automation.lastRunAt && ` · ${t("stats.last")} ${new Date(automation.lastRunAt).toLocaleDateString("es-ES")}`}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
              onClick={() => onEdit(automation)} title={tCommon("edit")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-violet-500"
              onClick={() => test.mutate(automation.id)}
              disabled={test.isPending}
              title={t("stats.testNow")}
            >
              {test.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <FlaskConical className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => toggle.mutate(automation.id)}
              title={automation.isActive ? t("stats.pause") : t("stats.activate")}
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
  const t = useTranslations("automations");
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mb-6">
        <Lock className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-2">{t("planWall.title")}</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {t("planWall.description")}
      </p>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <LocaleLink href="/billing">{t("planWall.viewPlans")}</LocaleLink>
        </Button>
        <Button asChild>
          <LocaleLink href="/billing">{t("planWall.upgradeStarter")}</LocaleLink>
        </Button>
      </div>
    </div>
  );
}

// ─── Templates Section ────────────────────────────────────────────────────────

function TemplatesSection({ onApply }: { onApply: (tpl: typeof TEMPLATES[number]) => void }) {
  const t = useTranslations("automations");
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{t("templates.title")}</h2>
        <span className="text-xs text-muted-foreground">{t("templates.clickToUse")}</span>
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
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">{t(tpl.name)}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t(tpl.description)}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 font-medium">
                    {(() => { const tr = TRIGGERS.find(x => x.value === tpl.trigger); return tr ? t(tr.label) : tpl.trigger; })()}
                  </span>
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">
                    {(() => { const act = ACTIONS.find(x => x.value === tpl.action); return act ? t(act.label) : tpl.action; })()}
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
  const t = useTranslations("automations");
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
          <span className="text-sm font-medium">{t("logs.title")}</span>
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
              {t("logs.noLogs")}
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
                      {(() => { const tr = TRIGGERS.find(x => x.value === log.trigger); return tr ? t(tr.label) : log.trigger; })()}
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
  const t = useTranslations("automations");
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
      name: t(tpl.name),
      description: t(tpl.description),
      trigger: tpl.trigger,
      action: tpl.action,
      actionConfig: tpl.actionConfig,
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        {!isBlocked && (
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("newRule")}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t("stats.totalRules"),      value: stats?.total    ?? 0 },
          { label: t("active"),                value: stats?.active   ?? 0 },
          { label: t("stats.totalExecutions"), value: stats?.totalRuns ?? 0 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
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
              <p className="font-semibold text-lg">{t("noAutomations")}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {t("emptyDescription")}
              </p>
              <Button className="mt-6 gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" /> {t("createFromScratch")}
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
