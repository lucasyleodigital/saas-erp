"use client";

import { useState } from "react";
import { usePipeline, useMoveDealStage, useCreateDeal, useCreatePipeline, useDeleteDeal } from "@/hooks/use-deals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Plus, MoreHorizontal, GitBranch, CheckCircle2, Trash2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { DealDialog } from "./deal-dialog";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STAGE_COLORS: Record<string, string> = {
  "lead": "bg-blue-500",
  "cualificado": "bg-indigo-500",
  "propuesta": "bg-violet-500",
  "negociación": "bg-purple-500",
  "ganado": "bg-emerald-500",
  "perdido": "bg-slate-400",
};

export function PipelineView() {
  const t = useTranslations("pipeline");
  const { data: pipelines, isLoading } = usePipeline();
  const moveStage = useMoveDealStage();
  const deleteDeal = useDeleteDeal();
  const createPipeline = useCreatePipeline();
  const [dragging, setDragging] = useState<{ dealId: string; fromStageId: string } | null>(null);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [pipelineName, setPipelineName] = useState(t("empty.defaultName"));
  const [activePipelineIdx, setActivePipelineIdx] = useState(0);
  const [notesDeal, setNotesDeal] = useState<any | null>(null);

  const pipeline = pipelines?.[activePipelineIdx] ?? pipelines?.[0];
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
      <div className="flex gap-3 overflow-x-auto pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-48 shrink-0 h-96 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <GitBranch className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t("empty.title")}</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{t("empty.description")}</p>
        <div className="flex gap-3 w-full mb-4">
          <Input value={pipelineName} onChange={(e) => setPipelineName(e.target.value)} placeholder={t("empty.namePlaceholder")} className="flex-1" />
          <Button onClick={() => createPipeline.mutate(pipelineName || t("empty.defaultName"))} disabled={createPipeline.isPending}>
            <Plus className="h-4 w-4 mr-1.5" />{t("empty.create")}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full text-left mt-2">
          {(["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />{t(`stages.${s}`)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const name = prompt(t("newPipelinePrompt"), t("empty.defaultName"));
            if (name) createPipeline.mutate(name);
          }}>
            <Plus className="h-4 w-4 mr-1" />{t("newPipeline")}
          </Button>
          <Button className="gap-2" onClick={() => setDealDialogOpen(true)}>
            <Plus className="h-4 w-4" />{t("new")}
          </Button>
        </div>
      </div>

      {/* Pipeline selector */}
      {pipelines && pipelines.length > 1 && (
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {pipelines.map((p: any, i: number) => (
            <button key={p.id} onClick={() => setActivePipelineIdx(i)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${activePipelineIdx === i ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      <DealDialog open={dealDialogOpen} onOpenChange={setDealDialogOpen} stages={stages} />
      <NotesDialog deal={notesDeal} onClose={() => setNotesDeal(null)} />

      {/* Board — columnas compactas */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin">
        {stages.map((stage: any) => {
          const stageTotal = stage.deals.reduce((sum: number, d: any) => sum + Number(d.value ?? 0), 0);
          const colorKey = stage.name.toLowerCase();
          const dotColor = STAGE_COLORS[colorKey] ?? "bg-muted-foreground";

          return (
            <div key={stage.id} className="w-44 shrink-0 flex flex-col gap-1.5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.id)}>

              {/* Column header */}
              <div className="flex items-center justify-between px-1 py-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
                  <span className="text-xs font-semibold truncate">{stage.name}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded-full shrink-0">
                    {stage.deals.length}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                  {formatCurrency(stageTotal)}
                </span>
              </div>

              {/* Drop zone */}
              <div className="flex flex-col gap-1.5 min-h-[100px] rounded-lg bg-muted/30 p-1.5 border-2 border-dashed border-transparent transition-colors">
                {stage.deals.length === 0 && (
                  <div className="flex items-center justify-center h-16 text-[10px] text-muted-foreground">
                    {t("dragHere")}
                  </div>
                )}
                {stage.deals.map((deal: any, i: number) => (
                  <motion.div key={deal.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    draggable onDragStart={() => handleDragStart(deal.id, stage.id)}>
                    <DealCard deal={deal}
                      onDelete={() => { if (confirm(t("confirmDelete", { title: deal.title }))) deleteDeal.mutate(deal.id); }}
                      onNotes={() => setNotesDeal(deal)} />
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

function DealCard({ deal, onDelete, onNotes }: { deal: any; onDelete: () => void; onNotes: () => void }) {
  const t = useTranslations("pipeline");
  return (
    <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-border/60">
      <CardContent className="p-2 space-y-1.5">
        {/* Title + menu */}
        <div className="flex items-start justify-between gap-1">
          <p className="text-xs font-medium leading-tight line-clamp-2 flex-1">{deal.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 -mr-0.5 -mt-0.5 text-muted-foreground">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onNotes}>
                <FileText className="h-4 w-4 mr-2" />Notas
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />{t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Client */}
        {deal.client && (
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-semibold shrink-0">
              {getInitials(deal.client.name)}
            </div>
            <span className="text-[10px] text-muted-foreground truncate">{deal.client.name}</span>
          </div>
        )}

        {/* Notes preview */}
        {deal.notes && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 bg-muted/40 rounded px-1.5 py-1 cursor-pointer hover:bg-muted/70 transition-colors" onClick={onNotes}>
            {deal.notes}
          </p>
        )}

        {/* Value + date */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-primary">{formatCurrency(Number(deal.value ?? 0))}</span>
          {deal.closeDate && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(deal.closeDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NotesDialog({ deal, onClose }: { deal: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync notes when deal changes
  useState(() => { if (deal) setNotes(deal.notes ?? ""); });

  if (!deal) return null;

  // Initialize on open
  if (deal && notes === "" && deal.notes) setNotes(deal.notes);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/deals/${deal.id}`, { notes });
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Notas guardadas");
      onClose();
    } catch {
      toast.error("Error al guardar las notas");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!deal} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {deal.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Notas del lead</Label>
          <textarea
            className="w-full min-h-[160px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Escribe aquí el seguimiento, conversaciones, próximos pasos..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
