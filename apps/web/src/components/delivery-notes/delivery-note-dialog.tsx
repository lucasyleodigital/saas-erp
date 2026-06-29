"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDeliveryNote } from "@/hooks/use-delivery-notes";
import { useClients } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const lineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Descripción requerida"),
  quantity: z.coerce.number().min(0.001),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).max(100).optional(),
});

const schema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  issueDate: z.string(),
  deliveryDate: z.string().optional(),
  items: z.array(lineSchema).min(1, "Añade al menos una línea"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface DeliveryNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeliveryNoteDialog({ open, onOpenChange }: DeliveryNoteDialogProps) {
  const t = useTranslations("deliveryNotes.dialog");
  const createNote = useCreateDeliveryNote();
  const { data: clientsData } = useClients({ limit: 200 } as any);
  const { data: productsData } = useProducts();
  const clients = clientsData?.data ?? [];
  const products = productsData?.data ?? [];

  const today = new Date().toISOString().split("T")[0]!;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      issueDate: today,
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  useEffect(() => {
    if (open) {
      reset({
        issueDate: today,
        items: [{ description: "", quantity: 1, unitPrice: 0 }],
      });
    }
  }, [open, reset, today]);

  function handleProductChange(index: number, productId: string) {
    const product = products.find((p: any) => p.id === productId);
    if (product) {
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.unitPrice`, Number(product.price));
      setValue(`items.${index}.productId`, productId);
    }
  }

  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    return sum + qty * price * (1 - disc / 100);
  }, 0);
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  async function onSubmit(data: FormData) {
    await createNote.mutateAsync(data as any);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Cliente + Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-1.5">
              <Label>{t("client")}</Label>
              <select
                {...register("clientId")}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t("selectClient")}</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-xs text-destructive">{errors.clientId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("issueDate")}</Label>
              <Input type="date" {...register("issueDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("deliveryDate")}</Label>
              <Input type="date" {...register("deliveryDate")} />
            </div>
          </div>

          {/* Líneas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("lines")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
              >
                <Plus className="h-3 w-3 mr-1" />
                {t("addLine")}
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-2 px-1 text-xs font-medium text-muted-foreground hidden sm:grid">
              <div className="col-span-4">{t("description")}</div>
              <div className="col-span-2">{t("product")}</div>
              <div className="col-span-2 text-right">{t("quantity")}</div>
              <div className="col-span-2 text-right">{t("price")}</div>
              <div className="col-span-1 text-right">{t("discount")}</div>
              <div className="col-span-1" />
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 sm:col-span-4">
                  <Input
                    {...register(`items.${index}.description`)}
                    placeholder={t("descriptionPlaceholder")}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>
                <div className="col-span-12 sm:col-span-2">
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    defaultValue=""
                  >
                    <option value="">{t("selectProduct")}</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    {...register(`items.${index}.quantity`)}
                    className="text-right"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`items.${index}.unitPrice`)}
                    className="text-right"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    {...register(`items.${index}.discount`)}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("iva")}</span>
                <span>{formatCurrency(iva)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t border-border pt-1.5">
                <span>{t("total")}</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>{t("notes")}</Label>
            <textarea
              {...register("notes")}
              placeholder={t("notesPlaceholder")}
              rows={2}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:text-muted-foreground"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createNote.isPending}>
              {createNote.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
