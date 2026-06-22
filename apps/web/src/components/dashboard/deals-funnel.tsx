"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const stages = [
  { label: "Lead", count: 24, value: 48000, color: "bg-blue-500" },
  { label: "Cualificado", count: 18, value: 36500, color: "bg-indigo-500" },
  { label: "Propuesta", count: 11, value: 28200, color: "bg-violet-500" },
  { label: "Negociación", count: 7, value: 18900, color: "bg-purple-500" },
  { label: "Cerrado", count: 4, value: 12800, color: "bg-emerald-500" },
];

export function DealsFunnel() {
  const maxCount = Math.max(...stages.map((s) => s.count));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Embudo de ventas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{stage.label}</span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{stage.count} oport.</span>
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
