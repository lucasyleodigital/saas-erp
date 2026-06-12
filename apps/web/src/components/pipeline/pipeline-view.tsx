"use client";

import { useState } from "react";
import { usePipeline, useMoveDealStage, useCreateDeal } from "@/hooks/use-deals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Plus, MoreHorizontal, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { DealDialog } from "./deal-dialog";
import { useTranslations } from "next-intl";

const STAGE_COLORS: Record<string, string> = {
  "lead": "bg-blue-500",
  "qualified": "bg-indigo-500",
  "proposal": "bg-violet-500",
  "negotiation": "bg-purple-500",
  "closed_won": "bg-emerald-500",
  "closed_lost": "bg-slate-400",
};

export function PipelineView() {
  const t = useTranslations("pipeline");
  const { data: pipelines, isLoading } = usePipeline();
  const moveStage = useMoveDealStage();
  const [dragging, setDragging] = useState<{ dealId: string; fromStageId: string } | null>(null);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);

  const pipeline = pipelines?.[0];
  const stages = pipeline?.stages ?? [];

  function handleDragStart(dealId: string, fromStageId: string) {
    setDragging({ dealId, fromStageId });
  }

  function handleDrop(toStageId: string) {
    if (dragging && dragging.fromStageId !== toStageId) {
      moveStage.mutate({ id: dragging.dealId, stageId: toStageId });
    }
    setDragging(null);
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-72 shrink-0 h-96 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-medium">No hay pipelines configurados</p>
        <p className="text-sm text-muted-foreground mt-1">
          Conecta la base de datos y crea un pipeline primero.
        </p>
      </div>
    );
  }

  const totalValue = stages
    .flatMap((s: any) => s.deals)
    .reduce((sum: number, d: any) => sum + Number(d.value ?? 0), 0);

  const totalDeals = stages.reduce((sum: number, s: any) => sum + s.deals.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button className="gap-2" onClick={() => setDealDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      <DealDialog open={dealDialogOpen} onOpenChange={setDealDialogOpen} stages={stages} />

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {stages.map((stage: any) => {
          const stageTotal = stage.deals.reduce(
            (sum: number, d: any) => sum + Number(d.value ?? 0),
            0
          );
          const colorKey = stage.name.toLowerCase().replace(/\s+/g, "_");
          const dotColor = STAGE_COLORS[colorKey] ?? "bg-muted-foreground";

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 flex flex-col gap-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                  <span className="text-sm font-semibold">{stage.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {stage.deals.length}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(stageTotal)}
                </span>
              </div>

              {/* Drop zone */}
              <div className="flex flex-col gap-2 min-h-[120px] rounded-xl bg-muted/30 p-2 border-2 border-dashed border-transparent transition-colors data-[over=true]:border-primary/40 data-[over=true]:bg-primary/5">
                {stage.deals.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                    Arrastra deals aquí
                  </div>
                )}
                {stage.deals.map((deal: any, i: number) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    draggable
                    onDragStart={() => handleDragStart(deal.id, stage.id)}
                  >
                    <DealCard deal={deal} />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DealCard({ deal }: { deal: any }) {
  return (
    <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-border/60">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight line-clamp-2">{deal.title}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-1 -mt-0.5 text-muted-foreground">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>

        {deal.client && (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-semibold">
              {getInitials(deal.client.name)}
            </div>
            <span className="text-xs text-muted-foreground truncate">{deal.client.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(Number(deal.value ?? 0))}
          </span>
          {deal.closeDate && (
            <span className="text-xs text-muted-foreground">
              {new Date(deal.closeDate).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
