"use client";

import type { Metadata } from "next";
import { PricingCards } from "@/components/billing/pricing-cards";
import { useMyCompany } from "@/hooks/use-company";
import { useCustomerPortal } from "@/hooks/use-billing";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";

export default function BillingPage() {
  const { data: company, isLoading } = useMyCompany();
  const portal = useCustomerPortal();

  const currentPlan: string = company?.plan ?? "FREE";
  const hasPaidPlan = currentPlan !== "FREE";

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
                Gestiona tu método de pago, descarga facturas o cancela desde el portal de facturación.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            disabled={portal.isPending}
            onClick={() => portal.mutate()}
          >
            {portal.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Gestionar suscripción
          </Button>
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
