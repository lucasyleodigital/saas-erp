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
import { trackEvent } from "@/lib/analytics";
import { useTranslations } from "next-intl";

interface Plan {
  key: string;
  label: string;
  price: number;
  description: string;
  features: string[];
  cta: string;
  badge?: string;
}

const PLAN_KEYS = ["free", "starter", "pro", "enterprise"] as const;
const PLAN_PRICES: Record<(typeof PLAN_KEYS)[number], number> = { free: 0, starter: 29, pro: 79, enterprise: 199 };

interface PricingCardsProps {
  currentPlan?: string;
  onUpgrade?: () => void;
}

export function PricingCards({ currentPlan = "FREE", onUpgrade }: PricingCardsProps) {
  const t = useTranslations("marketing.pricing");
  const [loading, setLoading] = useState<string | null>(null);
  const [showContract, setShowContract] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);

  const PLANS: Plan[] = PLAN_KEYS.map((tKey) => ({
    key: tKey.toUpperCase(),
    label: t(`plans.${tKey}.label`),
    price: PLAN_PRICES[tKey],
    description: t(`plans.${tKey}.description`),
    features: t.raw(`plans.${tKey}.features`) as string[],
    cta: t(`plans.${tKey}.cta`),
    badge: tKey === "pro" ? t("mostPopular") : undefined,
  }));

  async function goToStripe(planKey: string) {
    setLoading(planKey);
    const plan = PLANS.find((p) => p.key === planKey);
    trackEvent("begin_checkout", {
      plan: planKey,
      value: plan?.price ?? 0,
      currency: "EUR",
    });
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
    // Surface the auto-renewal terms on our own screen before redirecting
    // to Stripe's payment page, instead of only relying on Stripe's copy.
    setConfirmPlan(planKey);
  }

  return (
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {PLANS.map((plan) => {
        const isCurrent = plan.key === currentPlan;
        const isPopular = plan.key === "PRO";

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
                <Badge className="shadow-sm">{plan.badge}</Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">{plan.label}</span>
                {isCurrent && <Badge variant="outline">{t("current")}</Badge>}
              </div>
              <div className="mt-2">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold">{t("free")}</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}€</span>
                    <span className="text-muted-foreground text-sm">{t("perMonth")}</span>
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
                  ? t("redirecting")
                  : isCurrent
                  ? t("currentPlan")
                  : plan.cta}
              </Button>
              {plan.price > 0 && (
                <p className="text-[11px] text-muted-foreground text-center -mt-1">
                  {t("renewalNotice")}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>

    {/* Renewal disclosure — shown before redirecting Starter/Pro to Stripe */}
    <Dialog open={!!confirmPlan} onOpenChange={(o) => { if (!o) setConfirmPlan(null); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("confirm.title")}</DialogTitle>
          <DialogDescription>
            {PLANS.find((p) => p.key === confirmPlan)?.label} — {PLANS.find((p) => p.key === confirmPlan)?.price}€{t("perMonth")}
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>{t("confirm.body1", { price: PLANS.find((p) => p.key === confirmPlan)?.price ?? 0 })}</p>
          <p>{t("confirm.body2")}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmPlan(null)}>
            {t("confirm.cancel")}
          </Button>
          <Button
            className="flex-1"
            disabled={loading === confirmPlan}
            onClick={() => {
              const plan = confirmPlan!;
              setConfirmPlan(null);
              goToStripe(plan);
            }}
          >
            {loading === confirmPlan ? t("redirecting") : `${t("confirm.continue")} →`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

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
          De una parte, <strong>Alex Lucas Torrubia</strong> (NIF 41003566V), titular de la plataforma YouWhole bajo el nombre comercial «Lucas y Leo Digital», accesible en youwhole.com (en adelante, «YouWhole» o «Prestador»).<br />
          De otra parte, la empresa suscriptora identificada durante el proceso de registro (en adelante, «Cliente»).</p>

          <p><strong>2. OBJETO</strong><br />
          El Prestador proporciona al Cliente acceso a la plataforma SaaS YouWhole en su modalidad Enterprise, que incluye: CRM, facturación electrónica con VeriFactu, contabilidad, nóminas, gestión de inventario y todos los módulos disponibles sin límite de usuarios ni volumen.</p>

          <p><strong>3. PRECIO Y FACTURACIÓN</strong><br />
          El precio del servicio es de <strong>199€/mes (IVA incluido)</strong>, facturado mensualmente mediante cargo automático a la tarjeta de crédito o débito facilitada. La primera factura se emite en la fecha de alta. Las siguientes, el mismo día de cada mes.</p>

          <p><strong>4. ACUERDO DE NIVEL DE SERVICIO (SLA)</strong><br />
          YouWhole garantiza una disponibilidad mínima del <strong>99,5% mensual</strong> de la plataforma. En caso de incumplimiento, el Cliente tendrá derecho a un descuento proporcional en la siguiente factura. Se excluyen del cómputo las interrupciones por mantenimiento programado (comunicadas con 48 h de antelación) y causas de fuerza mayor.<br />
          Soporte prioritario disponible en <strong>horario 9:00–19:00 L–V (hora peninsular española)</strong> con tiempo de respuesta garantizado de <strong>4 horas laborables</strong>.</p>

          <p><strong>5. DURACIÓN Y CANCELACIÓN</strong><br />
          El contrato es de duración indefinida con renovación mensual automática. El Cliente puede cancelar en cualquier momento desde el panel de control o enviando un email a ventas@youwhole.com. La cancelación surte efecto al final del período mensual en curso. No hay permanencia ni penalización por cancelación.</p>

          <p><strong>6. PROTECCIÓN DE DATOS (RGPD)</strong><br />
          YouWhole actúa como Encargado del Tratamiento de los datos que el Cliente introduce en la plataforma. El Cliente es el Responsable del Tratamiento. Los datos se almacenan en servidores dentro de la Unión Europea. YouWhole no cederá datos a terceros salvo obligación legal. Para más información, consulta nuestra Política de Privacidad en youwhole.com/privacidad.</p>

          <p><strong>7. PROPIEDAD INTELECTUAL</strong><br />
          La plataforma YouWhole y todos sus componentes son propiedad exclusiva de Alex Lucas Torrubia. El Cliente recibe una licencia de uso no exclusiva e intransferible durante la vigencia del contrato. Los datos introducidos por el Cliente son de su exclusiva propiedad.</p>

          <p><strong>8. LIMITACIÓN DE RESPONSABILIDAD</strong><br />
          La responsabilidad máxima de YouWhole frente al Cliente no superará el importe de las cuotas abonadas en los últimos 3 meses. YouWhole no responde de daños indirectos, lucro cesante ni pérdida de datos por uso indebido de la plataforma.</p>

          <p><strong>9. LEY APLICABLE Y JURISDICCIÓN</strong><br />
          Este contrato se rige por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Barcelona, con renuncia expresa a cualquier otro fuero.</p>

          <p className="text-xs">Versión 1.1 — Agosto 2026 · YouWhole es una marca comercial de Alex Lucas Torrubia.</p>
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
