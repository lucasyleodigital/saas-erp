"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { LocaleLink } from "@/components/ui/locale-link";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAutomations, useCreateAutomation,
  useToggleAutomation, useDeleteAutomation, useUpdateAutomation,
  useTestAutomation, useAutomationLogs,
} from "@/hooks/use-automations";
import { usePlanUsage } from "@/hooks/use-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Zap, Plus, Trash2, Play, Pause, Mail, Bell,
  FileText, Users, CreditCard, Loader2,
  Pencil, ArrowRight, Lock, FlaskConical,
  ShoppingCart, PackageCheck, AlertTriangle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { useTranslations } from "next-intl";

// ─── Trigger / Action maps ─────────────────────────────────────────────────────

const TRIGGERS = [
  { value: "CLIENT_CREATED",          label: "triggers.clientCreated",      icon: Users,          color: "text-blue-500",     bg: "bg-blue-500/10" },
  { value: "INVOICE_CREATED",         label: "triggers.invoiceCreated",     icon: FileText,       color: "text-violet-500",   bg: "bg-violet-500/10" },
  { value: "INVOICE_PAID",            label: "triggers.invoicePaid",        icon: CreditCard,     color: "text-emerald-500",  bg: "bg-emerald-500/10" },
  { value: "INVOICE_OVERDUE",         label: "triggers.invoiceOverdue",     icon: FileText,       color: "text-red-500",      bg: "bg-red-500/10" },
  { value: "QUOTE_CREATED",           label: "triggers.quoteCreated",       icon: FileText,       color: "text-violet-500",   bg: "bg-violet-500/10" },
  { value: "QUOTE_ACCEPTED",          label: "triggers.quoteAccepted",      icon: FileText,       color: "text-emerald-500",  bg: "bg-emerald-500/10" },
  { value: "PAYMENT_RECEIVED",        label: "triggers.paymentReceived",    icon: CreditCard,     color: "text-emerald-500",  bg: "bg-emerald-500/10" },
  { value: "ORDER_CREATED",           label: "triggers.orderCreated",       icon: ShoppingCart,   color: "text-orange-500",   bg: "bg-orange-500/10" },
  { value: "PURCHASE_ORDER_RECEIVED", label: "triggers.purchaseReceived",   icon: PackageCheck,   color: "text-teal-500",     bg: "bg-teal-500/10" },
  { value: "LOW_STOCK",               label: "triggers.lowStock",           icon: AlertTriangle,  color: "text-red-500",      bg: "bg-red-500/10" },
];

const ACTIONS = [
  { value: "SEND_EMAIL",          label: "actions.sendEmail",          icon: Mail, color: "text-blue-500",   bg: "bg-blue-500/10" },
  { value: "CREATE_NOTIFICATION", label: "actions.createNotification", icon: Bell, color: "text-amber-500",  bg: "bg-amber-500/10" },
];

// ─── Pre-built rules ───────────────────────────────────────────────────────────

const PREBUILT = [
  {
    id: "welcome",
    icon: "👋",
    trigger: "CLIENT_CREATED",
    action: "SEND_EMAIL",
    actionConfig: {
      subject: "Bienvenido a {{companyName}}, {{clientName}}",
      body: "Hola {{clientName}},\n\nNos alegra tenerte como cliente. Estamos aquí para ayudarte en lo que necesites.\n\nSaludos,\n{{companyName}}",
    },
    nameKey: "prebuilt.welcome.name",
    descKey: "prebuilt.welcome.desc",
  },
  {
    id: "invoice_paid",
    icon: "✅",
    trigger: "INVOICE_PAID",
    action: "SEND_EMAIL",
    actionConfig: {
      subject: "Pago recibido — Factura {{invoiceNumber}}",
      body: "Estimado {{clientName}},\n\nHemos recibido tu pago correctamente. Gracias por tu confianza.\n\nSaludos,\n{{companyName}}",
    },
    nameKey: "prebuilt.invoicePaid.name",
    descKey: "prebuilt.invoicePaid.desc",
  },
  {
    id: "overdue",
    icon: "⏰",
    trigger: "INVOICE_OVERDUE",
    action: "SEND_EMAIL",
    actionConfig: {
      subject: "Recordatorio: Factura {{invoiceNumber}} pendiente",
      body: "Estimado {{clientName}},\n\nTe recordamos que la factura {{invoiceNumber}} por importe de {{amount}} está pendiente de pago.\n\nSi ya has realizado el pago, ignora este mensaje.\n\nGracias,\n{{companyName}}",
    },
    nameKey: "prebuilt.overdue.name",
    descKey: "prebuilt.overdue.desc",
  },
  {
    id: "low_stock",
    icon: "📦",
    trigger: "LOW_STOCK",
    action: "CREATE_NOTIFICATION",
    actionConfig: {
      title: "Stock bajo: {{productName}}",
      body: "Solo quedan {{currentStock}} unidades de {{productName}} (mínimo: {{minStock}})",
    },
    nameKey: "prebuilt.lowStock.name",
    descKey: "prebuilt.lowStock.desc",
  },
];

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  trigger:      z.string().min(1),
  action:       z.string().min(1),
  emailSubject: z.string().optional(),
  emailBody:    z.string().optional(),
  notifTitle:   z.string().optional(),
  notifBody:    z.string().optional(),
});
type FormData = z.infer<typeof schema>;

// ─── Rule Dialog ───────────────────────────────────────────────────────────────

function RuleDialog({
  open, onOpenChange, prefill,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  prefill?: { trigger: string; action: string; actionConfig: Record<string, string>; id?: string };
}) {
  const t = useTranslations("automations");
  const tCommon = useTranslations("common");
  const create = useCreateAutomation();
  const update = useUpdateAutomation();
  const isEdit = Boolean(prefill?.id);
  const pending = isEdit ? update.isPending : create.isPending;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      trigger:      prefill?.trigger ?? "",
      action:       prefill?.action ?? "SEND_EMAIL",
      emailSubject: prefill?.actionConfig?.subject ?? "",
      emailBody:    prefill?.actionConfig?.body ?? "",
      notifTitle:   prefill?.actionConfig?.title ?? "",
      notifBody:    prefill?.actionConfig?.body ?? "",
    },
  });

  const selectedTrigger = watch("trigger");
  const selectedAction  = watch("action");
  const triggerInfo     = TRIGGERS.find((tr) => tr.value === selectedTrigger);
  const actionInfo      = ACTIONS.find((a) => a.value === selectedAction);
  const TriggerIcon     = triggerInfo?.icon ?? Zap;
  const ActionIcon      = actionInfo?.icon ?? Zap;

  async function onSubmit(data: FormData) {
    let actionConfig: Record<string, string> = {};
    if (data.action === "SEND_EMAIL") {
      actionConfig = { subject: data.emailSubject ?? "", body: data.emailBody ?? "" };
    } else {
      actionConfig = { title: data.notifTitle ?? "", body: data.notifBody ?? "" };
    }
    const trig = TRIGGERS.find((tr) => tr.value === data.trigger);
    const act  = ACTIONS.find((a) => a.value === data.action);
    const name = `${trig ? t(trig.label) : data.trigger} → ${act ? t(act.label) : data.action}`;
    const payload = { name, trigger: data.trigger, action: data.action, actionConfig };

    if (isEdit && prefill?.id) {
      await update.mutateAsync({ id: prefill.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            {isEdit ? t("dialog.editTitle") : t("dialog.newTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* If/Then visual */}
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3">
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", triggerInfo?.bg ?? "bg-muted")}>
              <TriggerIcon className={cn("h-4 w-4", triggerInfo?.color ?? "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("dialog.when")}</p>
              <p className="text-sm font-medium truncate">{triggerInfo ? t(triggerInfo.label) : t("dialog.selectEvent")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", actionInfo?.bg ?? "bg-muted")}>
              <ActionIcon className={cn("h-4 w-4", actionInfo?.color ?? "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("dialog.then")}</p>
              <p className="text-sm font-medium truncate">{actionInfo ? t(actionInfo.label) : "—"}</p>
            </div>
          </div>

          {/* Trigger selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("dialog.whenLabel")}</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {TRIGGERS.map((tr) => {
                const Icon = tr.icon;
                const selected = selectedTrigger === tr.value;
                return (
                  <label
                    key={tr.value}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition-all text-sm",
                      selected ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-primary/40"
                    )}
                  >
                    <input type="radio" {...register("trigger")} value={tr.value} className="sr-only" />
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", tr.color)} />
                    <span className="truncate text-xs">{t(tr.label)}</span>
                  </label>
                );
              })}
            </div>
            {errors.trigger && <p className="text-xs text-destructive">{t("dialog.required")}</p>}
          </div>

          {/* Action selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("dialog.thenLabel")}</Label>
            <div className="flex gap-2">
              {ACTIONS.map((act) => {
                const Icon = act.icon;
                const selected = selectedAction === act.value;
                return (
                  <label
                    key={act.value}
                    className={cn(
                      "flex-1 flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-all",
                      selected ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-primary/40"
                    )}
                  >
                    <input type="radio" {...register("action")} value={act.value} className="sr-only" />
                    <Icon className={cn("h-4 w-4 shrink-0", act.color)} />
                    <span className="text-sm">{t(act.label)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Email config */}
          {selectedAction === "SEND_EMAIL" && (
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("dialog.emailConfig")}</p>
              <div className="space-y-1">
                <Label className="text-xs">{t("dialog.subject")} *</Label>
                <Input className="h-9 text-sm" {...register("emailSubject")} placeholder="Asunto del email" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("dialog.message")}</Label>
                <textarea
                  {...register("emailBody")}
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Texto del email..."
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {["{{clientName}}", "{{companyName}}", "{{invoiceNumber}}", "{{amount}}"].map((v) => (
                  <code key={v} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border">{v}</code>
                ))}
              </div>
            </div>
          )}

          {/* Notification config */}
          {selectedAction === "CREATE_NOTIFICATION" && (
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("dialog.notifConfig")}</p>
              <div className="space-y-1">
                <Label className="text-xs">{t("dialog.notifTitle")} *</Label>
                <Input className="h-9 text-sm" {...register("notifTitle")} placeholder="Título de la notificación" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("dialog.message")}</Label>
                <Input className="h-9 text-sm" {...register("notifBody")} placeholder="Mensaje..." />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              {isEdit ? tCommon("save") : t("dialog.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Prebuilt card ─────────────────────────────────────────────────────────────

function PrebuiltCard({ item, onCreate }: { item: typeof PREBUILT[number]; onCreate: () => void }) {
  const t = useTranslations("automations");
  const trig = TRIGGERS.find((tr) => tr.value === item.trigger);
  const act  = ACTIONS.find((a) => a.value === item.action);
  const TriggerIcon = trig?.icon ?? Zap;
  const ActionIcon  = act?.icon ?? Zap;
  const create = useCreateAutomation();

  async function handleAdd() {
    await create.mutateAsync({
      name: t(item.nameKey),
      trigger: item.trigger,
      action: item.action,
      actionConfig: item.actionConfig,
    });
    onCreate();
  }

  return (
    <button
      onClick={handleAdd}
      disabled={create.isPending}
      className="group text-left rounded-xl border border-border bg-card hover:border-primary/60 hover:shadow-sm transition-all p-4 w-full"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold group-hover:text-primary transition-colors">{t(item.nameKey)}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t(item.descKey)}</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className={cn("flex items-center gap-1 rounded-md px-2 py-1", trig?.bg ?? "bg-muted")}>
              <TriggerIcon className={cn("h-3 w-3", trig?.color)} />
              <span className="text-[10px] font-medium">{trig ? t(trig.label) : item.trigger}</span>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className={cn("flex items-center gap-1 rounded-md px-2 py-1", act?.bg ?? "bg-muted")}>
              <ActionIcon className={cn("h-3 w-3", act?.color)} />
              <span className="text-[10px] font-medium">{act ? t(act.label) : item.action}</span>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          {create.isPending
            ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            : <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
        </div>
      </div>
    </button>
  );
}

// ─── Rule card ─────────────────────────────────────────────────────────────────

function RuleCard({ automation, onEdit }: { automation: any; onEdit: () => void }) {
  const t = useTranslations("automations");
  const tCommon = useTranslations("common");
  const toggle  = useToggleAutomation();
  const remove  = useDeleteAutomation();
  const test    = useTestAutomation();

  const trig = TRIGGERS.find((tr) => tr.value === automation.trigger);
  const act  = ACTIONS.find((a) => a.value === automation.action);
  const TriggerIcon = trig?.icon ?? Zap;
  const ActionIcon  = act?.icon ?? Zap;

  return (
    <div className={cn(
      "rounded-xl border bg-card p-4 transition-all",
      !automation.isActive && "opacity-55"
    )}>
      <div className="flex items-center gap-3">
        {/* Status dot */}
        <div className={cn(
          "h-2 w-2 rounded-full shrink-0",
          automation.isActive ? "bg-emerald-500" : "bg-muted-foreground"
        )} />

        {/* Trigger → Action */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shrink-0", trig?.bg ?? "bg-muted")}>
            <TriggerIcon className={cn("h-3.5 w-3.5", trig?.color ?? "text-muted-foreground")} />
            <span className="text-xs font-medium whitespace-nowrap">{trig ? t(trig.label) : automation.trigger}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shrink-0", act?.bg ?? "bg-muted")}>
            <ActionIcon className={cn("h-3.5 w-3.5", act?.color ?? "text-muted-foreground")} />
            <span className="text-xs font-medium whitespace-nowrap">{act ? t(act.label) : automation.action}</span>
          </div>
          {automation.runCount > 0 && (
            <span className="text-xs text-muted-foreground truncate ml-1">
              · {automation.runCount} {t("card.runs")}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => test.mutate(automation.id)}
            disabled={test.isPending}
            title={t("card.test")}
          >
            {test.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />}
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={onEdit}
            title={tCommon("edit")}
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => toggle.mutate(automation.id)}
            title={automation.isActive ? t("card.pause") : t("card.activate")}
          >
            {automation.isActive
              ? <Pause className="h-4 w-4 text-amber-500" />
              : <Play className="h-4 w-4 text-emerald-500" />}
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => remove.mutate(automation.id)}
            title={tCommon("delete")}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>

      {/* Subject preview for emails */}
      {automation.action === "SEND_EMAIL" && automation.actionConfig?.subject && (
        <p className="text-xs text-muted-foreground mt-2 pl-5 truncate">
          <Mail className="h-3 w-3 inline mr-1 mb-0.5" />
          {automation.actionConfig.subject}
        </p>
      )}
    </div>
  );
}

// ─── Execution log ─────────────────────────────────────────────────────────────

function LogsPanel() {
  const t = useTranslations("automations");
  const [open, setOpen] = useState(false);
  const { data: logs = [], isLoading } = useAutomationLogs();

  return (
    <div className="rounded-xl border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t("logs.title")}</span>
          {logs.length > 0 && (
            <span className="text-xs bg-muted rounded-full px-2 py-0.5 font-medium">{logs.length}</span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="divide-y max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("logs.empty")}</p>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
                {log.success
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{log.automation?.name ?? "—"}</p>
                  {log.errorMessage && <p className="text-xs text-destructive truncate">{log.errorMessage}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                {(log.payload as any)?._test && (
                  <span className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded px-1.5 py-0.5">TEST</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Plan wall ─────────────────────────────────────────────────────────────────

function PlanWall() {
  const t = useTranslations("automations");
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mb-4">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-lg font-bold mb-2">{t("planWall.title")}</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">{t("planWall.description")}</p>
      <Button asChild>
        <LocaleLink href="/billing">{t("planWall.upgradeStarter")}</LocaleLink>
      </Button>
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────

export function AutomationsView() {
  const t = useTranslations("automations");
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<any>(null);

  const { data: automations = [], isLoading } = useAutomations();
  const { data: planUsage } = usePlanUsage();

  const maxAutomations = planUsage?.limits?.maxAutomations ?? -1;
  const isBlocked = maxAutomations === 0;

  function openEdit(automation: any) {
    setEditTarget({
      id: automation.id,
      trigger: automation.trigger,
      action: automation.action,
      actionConfig: automation.actionConfig ?? {},
    });
    setDialogOpen(true);
  }

  function openNew() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function closeDialog(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditTarget(null);
  }

  // Filter out prebuilt ids already added (by matching trigger+action)
  const existingKeys = new Set(automations.map((a: any) => `${a.trigger}|${a.action}`));
  const availablePrebuilt = PREBUILT.filter((p) => !existingKeys.has(`${p.trigger}|${p.action}`));

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        {!isBlocked && (
          <Button size="sm" className="gap-1.5" onClick={openNew}>
            <Plus className="h-4 w-4" />
            {t("newRule")}
          </Button>
        )}
      </div>

      {isBlocked ? <PlanWall /> : (
        <>
          {/* Active rules */}
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : automations.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-0.5">{t("section.activeRules")}</p>
              {automations.map((a: any) => (
                <RuleCard key={a.id} automation={a} onEdit={() => openEdit(a)} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/20 py-10 text-center">
              <Zap className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("empty.noRules")}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t("empty.addBelow")}</p>
            </div>
          )}

          {/* Prebuilt suggestions */}
          {availablePrebuilt.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-0.5">{t("section.suggestions")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availablePrebuilt.map((item) => (
                  <PrebuiltCard key={item.id} item={item} onCreate={() => {}} />
                ))}
              </div>
            </div>
          )}

          {/* Logs */}
          <LogsPanel />
        </>
      )}

      {/* Dialog */}
      <RuleDialog
        open={dialogOpen}
        onOpenChange={closeDialog}
        prefill={editTarget ?? undefined}
      />
    </div>
  );
}
