"use client";

import { useTranslations } from "next-intl";
import { Lock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/components/ui/locale-link";
import { useUser } from "@/hooks/use-user";
import { FEATURE_MIN_PLAN, usePlanFeature, type PlanFeature } from "@/hooks/use-plan";

export const PLAN_NAMES = { FREE: "Gratuito", STARTER: "Starter", PRO: "Pro", ENTERPRISE: "Enterprise" } as const;

export function UpgradeRequired({ feature, compact = false }: { feature: PlanFeature; compact?: boolean }) {
  const t = useTranslations("planGate");
  const { data: user } = useUser();
  const canManageBilling = user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const plan = PLAN_NAMES[FEATURE_MIN_PLAN[feature]];

  return (
    <Card className={compact ? "border-dashed" : "border-dashed max-w-xl mx-auto mt-6"}>
      <CardContent className={compact ? "py-6 text-center space-y-2" : "py-12 text-center space-y-3"}>
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <p className="font-semibold">{t("title", { plan })}</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{t(`features.${feature}`)}</p>
        {canManageBilling ? (
          <Button asChild size="sm" className="mt-1">
            <LocaleLink href="/billing">{t("cta")}</LocaleLink>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">{t("askAdmin")}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PlanGate({ feature, children }: { feature: PlanFeature; children: React.ReactNode }) {
  const allowed = usePlanFeature(feature);
  if (allowed === undefined) {
    return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  return allowed ? <>{children}</> : <UpgradeRequired feature={feature} />;
}
