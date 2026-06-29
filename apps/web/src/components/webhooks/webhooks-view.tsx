"use client";

import { useState } from "react";
import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
} from "@/hooks/use-webhooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Zap, Plus, Trash2, Globe, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// ─── Constants ───────────────────────────────────────────────────────────────

const AVAILABLE_EVENTS = [
  "INVOICE_CREATED",
  "INVOICE_PAID",
  "CLIENT_CREATED",
  "QUOTE_ACCEPTED",
  "PAYMENT_RECEIVED",
] as const;

// ─── Create Webhook Dialog ───────────────────────────────────────────────────

function CreateWebhookDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const t = useTranslations("webhooks");
  const create = useCreateWebhook();
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  function toggleEvent(value: string) {
    setSelectedEvents((prev) =>
      prev.includes(value)
        ? prev.filter((e) => e !== value)
        : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({ url, events: selectedEvents });
    onOpenChange(false);
    setUrl("");
    setSelectedEvents([]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {t("new")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("endpointUrl")}</Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("endpointPlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("events")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("eventsHint")}
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_EVENTS.map((event) => {
                const isSelected = selectedEvents.includes(event);
                return (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(event)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {t(`eventLabels.${event}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={create.isPending || !url || selectedEvents.length === 0}
            >
              {create.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Webhook Card ────────────────────────────────────────────────────────────

function WebhookCard({ webhook }: { webhook: any }) {
  const t = useTranslations("webhooks");
  const remove = useDeleteWebhook();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm font-semibold truncate">{webhook.url}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(webhook.events ?? []).map((event: string) => {
                return (
                  <Badge key={event} variant="secondary" className="text-[10px]">
                    {t(`eventLabels.${event}`)}
                  </Badge>
                );
              })}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => remove.mutate(webhook.id)}
            disabled={remove.isPending}
          >
            {remove.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function WebhooksView() {
  const t = useTranslations("webhooks");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: webhooks, isLoading } = useWebhooks();

  const list: any[] = webhooks ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <p className="font-semibold text-lg">{t("emptyTitle")}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {t("emptyDesc")}
          </p>
          <Button
            className="mt-6 gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> {t("create")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((webhook, i) => (
            <motion.div
              key={webhook.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <WebhookCard webhook={webhook} />
            </motion.div>
          ))}
        </div>
      )}

      <CreateWebhookDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
