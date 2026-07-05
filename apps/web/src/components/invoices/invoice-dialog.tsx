"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useMyCompany } from "@/hooks/use-company";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { CurrencySelector } from "./currency-selector";
import { LanguageSelector } from "./language-selector";
import { useTranslations } from "next-intl";
import { CustomFieldsSection } from "@/components/custom-fields/custom-fields-section";
import { useSaveCustomFieldValues } from "@/hooks/use-custom-fields";

const lineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.coerce.number().min(0.001),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).max(100).optional(),
});

const schema = z.object({
  clientId: z.string().min(1),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  items: z.array(lineSchema).min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDialog({ open, onOpenChange }: InvoiceDialogProps) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const createInvoice = useCreateInvoice();
  const saveCfValues = useSaveCustomFieldValues("INVOICE");
  const [cfValues, setCfValues] = useState<Record<string, string>>({});
  const { data: clientsData } = useClients({ limit: 200 } as any);
  const { data: productsData } = useProducts();
  const { data: projectsData } = useProjects({});
  const { data: company } = useMyCompany();
  const clients = clientsData?.data ?? [];
  const products = productsData?.data ?? [];
  const projects = projectsData?.data ?? projectsData ?? [];

  const [currency, setCurrency] = useState("EUR");
  const [language, setLanguage] = useState("es");
  const [projectId, setProjectId] = useState("");
  const [applyIrpf, setApplyIrpf] = useState(false);
  const [irpfRate, setIrpfRate] = useState(15);

  const settings = (company?.settings ?? {}) as any;
  const isAutonomo = settings.companyType === "AUTONOMO";
  const defaultIrpfRate = Number(settings.irpfRate) || 15;

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
  const selectedClientId = watch("clientId");

  const selectedClient = useMemo(
    () => clients.find((c: any) => c.id === selectedClientId),
    [clients, selectedClientId],
  );

  useEffect(() => {
    if (open) {
      reset({ issueDate: today, items: [{ description: "", quantity: 1, unitPrice: 0 }] });
      setCurrency("EUR");
      setLanguage("es");
      setProjectId("");
      setApplyIrpf(false);
      setIrpfRate(defaultIrpfRate);
      setCfValues({});
    }
  }, [open, reset, today]);

  useEffect(() => {
    if (!isAutonomo || !settings.autoApplyIrpf) {
      setApplyIrpf(false);
      return;
    }
    const clientType = selectedClient?.clientType;
    setApplyIrpf(clientType !== "PARTICULAR");
  }, [selectedClientId, selectedClient, isAutonomo, settings.autoApplyIrpf]);

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
  const irpfAmount = applyIrpf ? subtotal * (irpfRate / 100) : 0;
  const total = subtotal + iva - irpfAmount;

  async function onSubmit(data: FormData) {
    const taxes: any[] = [{ taxId: "iva-21", rate: 21, base: subtotal }];
    if (applyIrpf) {
      taxes.push({ taxId: `irpf-${irpfRate}`, rate: -irpfRate, base: subtotal });
    }

    const created = await createInvoice.mutateAsync({
      ...data,
      currency,
      language,
      projectId: projectId || undefined,
      taxes,
    } as any);
    if (Object.keys(cfValues).length > 0 && created?.id) {
      await saveCfValues.mutateAsync({ entityId: created.id, values: cfValues });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("form.dialogTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Cliente + Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-1.5">
              <Label>{t("form.clientRequired")}</Label>
              <select
                {...register("clientId")}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t("form.selectClient")}</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.clientType === "PARTICULAR" ? ` (${t("form.particular")})` : ""}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-xs text-destructive">{t("form.selectClientRequired")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("form.issueDate")}</Label>
              <Input type="date" {...register("issueDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("form.dueDate")}</Label>
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
              <Label>{t("form.project")}</Label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t("form.noProject")}</option>
                {(Array.isArray(projects) ? projects : []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* IRPF toggle para autonomos */}
          {isAutonomo && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/30">
              <input
                type="checkbox"
                id="apply-irpf"
                checked={applyIrpf}
                onChange={(e) => setApplyIrpf(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="apply-irpf" className="text-sm cursor-pointer flex-1">
                {t("form.applyIrpf")}
                {selectedClient?.clientType === "PARTICULAR" && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({t("form.noIrpfParticular")})
                  </span>
                )}
              </label>
              {applyIrpf && (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="25"
                    step="1"
                    value={irpfRate}
                    onChange={(e) => setIrpfRate(Number(e.target.value) || defaultIrpfRate)}
                    className="w-16 h-8 text-center text-sm"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
          )}

          {/* Lineas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("form.invoiceLines")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
              >
                <Plus className="h-3 w-3 mr-1" />
                {t("form.addLine")}
              </Button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-1 text-xs font-medium text-muted-foreground hidden sm:grid">
              <div className="col-span-4">{t("form.description")}</div>
              <div className="col-span-2">{t("form.product")}</div>
              <div className="col-span-2 text-right">{t("form.quantity")}</div>
              <div className="col-span-2 text-right">{t("form.price")}</div>
              <div className="col-span-1 text-right">{t("form.discount")}</div>
              <div className="col-span-1" />
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 sm:col-span-4">
                  <Input
                    {...register(`items.${index}.description`)}
                    placeholder={t("form.descriptionPlaceholder")}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-xs text-destructive mt-0.5">
                      {t("form.descriptionRequired")}
                    </p>
                  )}
                </div>
                <div className="col-span-12 sm:col-span-2">
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    defaultValue=""
                  >
                    <option value="">{t("form.selectProduct")}</option>
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
                <span className="text-muted-foreground">{t("form.subtotal")}</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("form.vat21")}</span>
                <span>{formatCurrency(iva, currency)}</span>
              </div>
              {applyIrpf && (
                <div className="flex justify-between text-red-500">
                  <span>IRPF -{irpfRate}%</span>
                  <span>-{formatCurrency(irpfAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base border-t border-border pt-1.5">
                <span>{t("form.total")}</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>{t("form.notesLabel")}</Label>
            <textarea
              {...register("notes")}
              placeholder={t("form.notesPlaceholder")}
              rows={2}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:text-muted-foreground"
            />
          </div>

          <CustomFieldsSection entity="INVOICE" values={cfValues} onChange={setCfValues} />

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("form.createInvoice")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
