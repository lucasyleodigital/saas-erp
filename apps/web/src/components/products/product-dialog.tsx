"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  sku: z.string().optional(),
  type: z.enum(["SERVICE", "DIGITAL", "PHYSICAL"]),
  price: z.coerce.number().min(0),
  cost: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

export function ProductDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: any;
}) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const isEditing = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(product?.id ?? "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "SERVICE" },
  });

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              name: product.name,
              description: product.description ?? "",
              sku: product.sku ?? "",
              type: product.type,
              price: Number(product.price),
              cost: product.cost ? Number(product.cost) : undefined,
            }
          : { type: "SERVICE", price: 0 }
      );
    }
  }, [open, product, reset]);

  async function onSubmit(data: FormData) {
    if (isEditing) await updateProduct.mutateAsync(data as any);
    else await createProduct.mutateAsync(data as any);
    onOpenChange(false);
  }

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("form.dialogTitleEdit") : t("form.dialogTitleNew")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("form.nameRequired")}</Label>
            <Input {...register("name")} placeholder={t("form.namePlaceholder")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{tCommon("description")}</Label>
            <textarea
              {...register("description")}
              placeholder={t("form.descriptionPlaceholder")}
              rows={2}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("form.type")}</Label>
              <Select
                value={watch("type")}
                onValueChange={(v) => setValue("type", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVICE">{t("type.service")}</SelectItem>
                  <SelectItem value="DIGITAL">{t("type.digital")}</SelectItem>
                  <SelectItem value="PHYSICAL">{t("type.physical")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("form.sku")}</Label>
              <Input {...register("sku")} placeholder="PROD-001" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("form.salePrice")}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("price")}
                placeholder="0.00"
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("form.cost")}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("cost")}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? tCommon("save") : tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
