"use client";

import { useState, useEffect } from "react";
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
import { useCreateInvoice } from "@/hooks/use-invoices";
import { useClients } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
import { useProjects } from "@/hooks/use-projects";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { CurrencySelector } from "./currency-selector";
import { LanguageSelector } from "./language-selector";

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
  dueDate: z.string().optional(),
  items: z.array(lineSchema).min(1, "Añade al menos una línea"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDialog({ open, onOpenChange }: InvoiceDialogProps) {
  const createInvoice = useCreateInvoice();
  const { data: clientsData } = useClients({ limit: 200 } as any);
  const { data: productsData } = useProducts();
  const { data: projectsData } = useProjects({});
  const clients = clientsData?.data ?? [];
  const products = productsData?.data ?? [];
  const projects = projectsData?.data ?? projectsData ?? [];

  const [currency, setCurrency] = useState("EUR");
  const [language, setLanguage] = useState("es");
  const [projectId, setProjectId] = useState("");

  const today = new Date().toISOString().split("T")[0];

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
      reset({ issueDate: today, items: [{ description: "", quantity: 1, unitPrice: 0 }] });
      setCurrency("EUR");
      setLanguage("es");
      setProjectId("");
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
    await createInvoice.mutateAsync({
      ...data,
      currency,
      language,
      projectId: projectId || undefined,
      taxes: [{ taxId: "iva-21", rate: 21, base: subtotal }],
    } as any);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva factura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Cliente + Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-1.5">
              <Label>Cliente *</Label>
              <select
                {...register("clientId")}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-xs text-destructive">{errors.clientId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Fecha emisión</Label>
              <Input type="date" {...register("issueDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha vencimiento</Label>
              <Input type="date" {...register("dueDate")} />
            </div>
          </div>

          {/* Moneda, idioma y proyecto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CurrencySelector
              value={currency}
              onChange={setCurrency}
              amount={total}
            />
            <LanguageSelector
              value={language}
              onChange={setLanguage}
            />
            <div className="space-y-1.5">
              <Label>Proyecto</Label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sin proyecto</option>
                {(Array.isArray(projects) ? projects : []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Líneas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Líneas de factura</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
              >
                <Plus className="h-3 w-3 mr-1" />
                Añadir línea
              </Button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-1 text-xs font-medium text-muted-foreground hidden sm:grid">
              <div className="col-span-4">Descripción</div>
              <div className="col-span-2">Producto</div>
              <div className="col-span-2 text-right">Cantidad</div>
              <div className="col-span-2 text-right">Precio</div>
              <div className="col-span-1 text-right">Dto%</div>
              <div className="col-span-1" />
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 sm:col-span-4">
                  <Input
                    {...register(`items.${index}.description`)}
                    placeholder="Descripción del servicio"
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
                    <option value="">— Producto</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
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
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA 21%</span>
                <span>{formatCurrency(iva, currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t border-border pt-1.5">
                <span>Total</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <textarea
              {...register("notes")}
              placeholder="Condiciones de pago, observaciones..."
              rows={2}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:text-muted-foreground"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear factura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
