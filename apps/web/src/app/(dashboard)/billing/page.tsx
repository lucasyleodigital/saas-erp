import type { Metadata } from "next";
import { PricingCards } from "@/components/billing/pricing-cards";

export const metadata: Metadata = { title: "Planes y facturación — YouWhole" };

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planes y facturación</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Elige el plan que mejor se adapte a las necesidades de tu empresa
        </p>
      </div>
      <PricingCards />
      <p className="text-xs text-muted-foreground text-center">
        Todos los precios incluyen IVA. Puedes cancelar en cualquier momento sin
        permanencia.
      </p>
    </div>
  );
}
