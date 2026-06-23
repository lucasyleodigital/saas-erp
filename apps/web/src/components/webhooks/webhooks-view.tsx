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

// ─── Constants ───────────────────────────────────────────────────────────────

const AVAILABLE_EVENTS = [
  { value: "INVOICE_CREATED", label: "Factura creada" },
  { value: "INVOICE_PAID", label: "Factura pagada" },
  { value: "CLIENT_CREATED", label: "Cliente creado" },
  { value: "QUOTE_ACCEPTED", label: "Presupuesto aceptado" },
  { value: "PAYMENT_RECEIVED", label: "Pago recibido" },
] as const;

// ─── Create Webhook Dialog ───────────────────────────────────────────────────

function CreateWebhookDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
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
            Nuevo webhook
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>URL del endpoint *</Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.tudominio.com/webhook"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Eventos</Label>
            <p className="text-xs text-muted-foreground">
              Selecciona los eventos que disparan el webhook
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_EVENTS.map((event) => {
                const isSelected = selectedEvents.includes(event.value);
                return (
                  <button
                    key={event.value}
                    type="button"
                    onClick={() => toggleEvent(event.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {event.label}
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
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={create.isPending || !url || selectedEvents.length === 0}
            >
              {create.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Crear webhook
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Webhook Card ────────────────────────────────────────────────────────────

function WebhookCard({ webhook }: { webhook: any }) {
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
                const config = AVAILABLE_EVENTS.find(
                  (e) => e.value === event
                );
                return (
                  <Badge key={event} variant="secondary" className="text-[10px]">
                    {config?.label ?? event}
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
            Webhooks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recibe notificaciones HTTP cuando ocurran eventos en tu cuenta
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo webhook
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
          <p className="font-semibold text-lg">Sin webhooks configurados</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Los webhooks permiten que sistemas externos reciban
            notificaciones automaticas cuando ocurren eventos en tu cuenta.
          </p>
          <Button
            className="mt-6 gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> Crear webhook
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
