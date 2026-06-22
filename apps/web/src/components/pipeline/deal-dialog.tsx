"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDeal } from "@/hooks/use-deals";
import { useClients } from "@/hooks/use-clients";
import { Loader2 } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  clientId: z.string().optional(),
  stageId: z.string().min(1, "Selecciona una etapa"),
  value: z.coerce.number().min(0).optional(),
  closeDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: { id: string; name: string }[];
}

export function DealDialog({ open, onOpenChange, stages }: DealDialogProps) {
  const createDeal = useCreateDeal();
  const { data: clientsData } = useClients({ limit: 200 } as any);
  const clients = clientsData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { value: 0 },
  });

  useEffect(() => {
    if (open) reset({ value: 0, stageId: stages[0]?.id ?? "" });
  }, [open, reset, stages]);

  async function onSubmit(data: FormData) {
    await createDeal.mutateAsync({
      ...data,
      ...(data.closeDate && { closeDate: new Date(data.closeDate).toISOString() }),
    } as any);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input {...register("title")} placeholder="Nombre del lead" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Etapa *</Label>
              <select
                {...register("stageId")}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor (€)</Label>
              <Input type="number" step="0.01" min="0" {...register("value")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <select
              {...register("clientId")}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sin cliente asignado</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Fecha de cierre estimada</Label>
            <Input type="date" {...register("closeDate")} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createDeal.isPending}>
              {createDeal.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Crear lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
