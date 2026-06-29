"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const stages = [
  { labelKey: "lead", count: 24, value: 48000, color: "bg-blue-500" },
  { labelKey: "qualified", count: 18, value: 36500, color: "bg-indigo-500" },
  { labelKey: "proposal", count: 11, value: 28200, color: "bg-violet-500" },
  { labelKey: "negotiation", count: 7, value: 18900, color: "bg-purple-500" },
  { labelKey: "closed", count: 4, value: 12800, color: "bg-emerald-500" },
];

export function DealsFunnel() {
  const t = useTranslations("dashboard.funnel");
  const maxCount = Math.max(...stages.map((s) => s.count));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.labelKey} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{t(stage.labelKey)}</span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{stage.count} {t("opportunities")}</span>
                <span>·</span>
                <span>{(stage.value / 1000).toFixed(0)}k €</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", stage.color)}
                style={{ width: `${(stage.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
