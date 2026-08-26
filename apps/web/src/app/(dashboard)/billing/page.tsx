"use client";

import { useState } from "react";
import { PricingCards } from "@/components/billing/pricing-cards";
import { useMyCompany } from "@/hooks/use-company";
import { useCustomerPortal } from "@/hooks/use-billing";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, Loader2, XCircle } from "lucide-react";

export default function BillingPage() {
  const { data: company, isLoading } = useMyCompany();
  const portal = useCustomerPortal();
  const [action, setAction] = useState<"manage" | "cancel" | null>(null);

  const currentPlan: string = company?.plan ?? "FREE";
  const hasPaidPlan = currentPlan !== "FREE";

  function openPortal(cancelSubscription: boolean) {
    setAction(cancelSubscription ? "cancel" : "manage");
    portal.mutate({ cancelSubscription });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Planes y facturación</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Elige el plan que mejor se adapte a las necesidades de tu empresa
        </p>
      </div>

      {hasPaidPlan && (
        <div className="rounded-xl border border-border bg-muted/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Suscripción activa — Plan {currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Se renueva automáticamente cada mes. Gestiona tu método de pago, descarga facturas o cancela cuando quieras, sin permanencia.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={portal.isPending}
              onClick={() => openPortal(false)}
            >
              {portal.isPending && action === "manage" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Gestionar suscripción
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={portal.isPending}
              onClick={() => openPortal(true)}
            >
              {portal.isPending && action === "cancel" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Cancelar suscripción
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PricingCards currentPlan={currentPlan} />
      )}

      <p className="text-xs text-muted-foreground text-center">
        Todos los precios incluyen IVA. Puedes cancelar en cualquier momento sin permanencia.
      </p>
    </div>
  );
}
