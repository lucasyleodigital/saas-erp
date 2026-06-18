"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const [showContract, setShowContract] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);

  async function goToStripe(planKey: string) {
    setLoading(planKey);
    try {
      const { data } = await api.post("/billing/checkout", {
        plan: planKey,
        successUrl: `${window.location.origin}/dashboard?upgraded=1`,
        cancelUrl: window.location.href,
      });
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("Error al iniciar el proceso de pago");
      setLoading(null);
    }
  }

  async function handleUpgrade(planKey: string) {
    if (planKey === "ENTERPRISE") {
      setShowContract(true);
      return;
    }
    await goToStripe(planKey);
  }

  return (
    <>
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

    {/* Enterprise contract modal */}
    <Dialog open={showContract} onOpenChange={(o) => { setShowContract(o); if (!o) setContractAccepted(false); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Contrato de Servicios — Plan Enterprise</DialogTitle>
          <DialogDescription>
            Lee y acepta el contrato antes de proceder al pago de 199€/mes (IVA incluido).
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 text-sm text-muted-foreground space-y-4 pr-1 border rounded-md p-4 my-2">
          <p className="font-semibold text-foreground">CONTRATO DE PRESTACIÓN DE SERVICIOS — YOUWHOLE ENTERPRISE</p>

          <p><strong>1. PARTES</strong><br />
          De una parte, <strong>Lucas y Leo Digital S.L.</strong> (en adelante, «YouWhole» o «Prestador»), titular de la plataforma YouWhole accesible en youwhole.es.<br />
          De otra parte, la empresa suscriptora identificada durante el proceso de registro (en adelante, «Cliente»).</p>

          <p><strong>2. OBJETO</strong><br />
          El Prestador proporciona al Cliente acceso a la plataforma SaaS YouWhole en su modalidad Enterprise, que incluye: CRM, facturación electrónica con VeriFactu, contabilidad, nóminas, gestión de inventario y todos los módulos disponibles sin límite de usuarios ni volumen.</p>

          <p><strong>3. PRECIO Y FACTURACIÓN</strong><br />
          El precio del servicio es de <strong>199€/mes (IVA incluido)</strong>, facturado mensualmente mediante cargo automático a la tarjeta de crédito o débito facilitada. La primera factura se emite en la fecha de alta. Las siguientes, el mismo día de cada mes.</p>

          <p><strong>4. ACUERDO DE NIVEL DE SERVICIO (SLA)</strong><br />
          YouWhole garantiza una disponibilidad mínima del <strong>99,5% mensual</strong> de la plataforma. En caso de incumplimiento, el Cliente tendrá derecho a un descuento proporcional en la siguiente factura. Se excluyen del cómputo las interrupciones por mantenimiento programado (comunicadas con 48 h de antelación) y causas de fuerza mayor.<br />
          Soporte prioritario disponible en <strong>horario 9:00–19:00 L–V (hora peninsular española)</strong> con tiempo de respuesta garantizado de <strong>4 horas laborables</strong>.</p>

          <p><strong>5. DURACIÓN Y CANCELACIÓN</strong><br />
          El contrato es de duración indefinida con renovación mensual automática. El Cliente puede cancelar en cualquier momento desde el panel de control o enviando un email a ventas@youwhole.es. La cancelación surte efecto al final del período mensual en curso. No hay permanencia ni penalización por cancelación.</p>

          <p><strong>6. PROTECCIÓN DE DATOS (RGPD)</strong><br />
          YouWhole actúa como Encargado del Tratamiento de los datos que el Cliente introduce en la plataforma. El Cliente es el Responsable del Tratamiento. Los datos se almacenan en servidores dentro de la Unión Europea. YouWhole no cederá datos a terceros salvo obligación legal. Para más información, consulta nuestra Política de Privacidad en youwhole.es/privacidad.</p>

          <p><strong>7. PROPIEDAD INTELECTUAL</strong><br />
          La plataforma YouWhole y todos sus componentes son propiedad exclusiva de Lucas y Leo Digital S.L. El Cliente recibe una licencia de uso no exclusiva e intransferible durante la vigencia del contrato. Los datos introducidos por el Cliente son de su exclusiva propiedad.</p>

          <p><strong>8. LIMITACIÓN DE RESPONSABILIDAD</strong><br />
          La responsabilidad máxima de YouWhole frente al Cliente no superará el importe de las cuotas abonadas en los últimos 3 meses. YouWhole no responde de daños indirectos, lucro cesante ni pérdida de datos por uso indebido de la plataforma.</p>

          <p><strong>9. LEY APLICABLE Y JURISDICCIÓN</strong><br />
          Este contrato se rige por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Barcelona, con renuncia expresa a cualquier otro fuero.</p>

          <p className="text-xs">Versión 1.0 — Junio 2026 · YouWhole es una marca de Lucas y Leo Digital S.L.</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
            checked={contractAccepted}
            onChange={(e) => setContractAccepted(e.target.checked)}
          />
          <span className="text-sm">
            He leído y acepto el contrato de servicios de YouWhole Enterprise, incluyendo el SLA y las condiciones de cancelación.
          </span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => { setShowContract(false); setContractAccepted(false); }}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!contractAccepted || loading === "ENTERPRISE"}
            onClick={() => { setShowContract(false); goToStripe("ENTERPRISE"); }}
          >
            {loading === "ENTERPRISE" ? "Redirigiendo..." : "Pagar 199€/mes →"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
