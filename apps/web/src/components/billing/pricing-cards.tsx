"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Plan {
  key: string;
  label: string;
  price: number;
  description: string;
  features: string[];
  cta: string;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    key: "FREE",
    label: "Gratuito",
    price: 0,
    description: "Para empezar sin compromiso",
    features: [
      "5 clientes",
      "10 facturas / mes",
      "1 usuario",
      "1 GB almacenamiento",
      "Dashboard básico",
    ],
    cta: "Plan actual",
  },
  {
    key: "STARTER",
    label: "Starter",
    price: 29,
    description: "Para autónomos y micropymes",
    features: [
      "50 clientes",
      "100 facturas / mes",
      "3 usuarios",
      "10 GB almacenamiento",
      "VeriFactu incluido",
      "CRM básico",
    ],
    cta: "Empezar Starter",
  },
  {
    key: "PRO",
    label: "Pro",
    price: 79,
    description: "Para empresas en crecimiento",
    features: [
      "500 clientes",
      "1.000 facturas / mes",
      "10 usuarios",
      "50 GB almacenamiento",
      "VeriFactu + IA",
      "CRM avanzado + Pipeline",
      "API access",
    ],
    cta: "Empezar Pro",
    badge: "Popular",
  },
  {
    key: "ENTERPRISE",
    label: "Enterprise",
    price: 199,
    description: "Sin límites para grandes equipos",
    features: [
      "Clientes ilimitados",
      "Facturas ilimitadas",
      "Usuarios ilimitados",
      "200 GB almacenamiento",
      "Todo incluido",
      "Soporte prioritario 24/7",
      "SLA garantizado",
    ],
    cta: "Contactar ventas",
  },
];

interface PricingCardsProps {
  currentPlan?: string;
  onUpgrade?: () => void;
}

export function PricingCards({ currentPlan = "FREE", onUpgrade }: PricingCardsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(planKey: string) {
    if (planKey === "ENTERPRISE") {
      window.open("mailto:ventas@youwhole.es?subject=Plan Enterprise", "_blank");
      return;
    }
    setLoading(planKey);
    try {
      const { data } = await api.post("/billing/checkout", {
        plan: planKey,
        successUrl: `${window.location.origin}/dashboard?upgraded=1`,
        cancelUrl: window.location.href,
      });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Error al iniciar el proceso de pago");
      setLoading(null);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {PLANS.map((plan) => {
        const isCurrent = plan.key === currentPlan;
        const isPopular = plan.badge === "Popular";

        return (
          <Card
            key={plan.key}
            className={cn(
              "relative flex flex-col",
              isCurrent && "border-primary",
              isPopular && !isCurrent && "border-primary/50 shadow-md"
            )}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="shadow-sm">Más popular</Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">{plan.label}</span>
                {isCurrent && <Badge variant="outline">Actual</Badge>}
              </div>
              <div className="mt-2">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold">Gratis</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}€</span>
                    <span className="text-muted-foreground text-sm">/mes</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 gap-4">
              <ul className="space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={
                  isCurrent
                    ? "outline"
                    : isPopular
                    ? "default"
                    : "outline"
                }
                disabled={
                  isCurrent ||
                  loading === plan.key ||
                  (currentPlan !== "FREE" && plan.key === "FREE")
                }
                onClick={() => !isCurrent && handleUpgrade(plan.key)}
              >
                {loading === plan.key
                  ? "Redirigiendo..."
                  : isCurrent
                  ? "Plan actual"
                  : plan.cta}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
