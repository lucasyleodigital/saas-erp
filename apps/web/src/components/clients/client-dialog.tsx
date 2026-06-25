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
import { useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const schema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  cifNif: z.string().optional(),
  clientType: z.enum(["EMPRESA", "AUTONOMO", "PARTICULAR"]).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
}

export function ClientDialog({ open, onOpenChange, client }: ClientDialogProps) {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");

  const isEditing = !!client;
  const createClient = useCreateClient();
  const updateClient = useUpdateClient(client?.id ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset(
        client
          ? {
              name: client.name ?? "",
              legalName: client.legalName ?? "",
              cifNif: client.cifNif ?? "",
              clientType: client.clientType ?? "EMPRESA",
              email: client.email ?? "",
              phone: client.phone ?? "",
              mobile: client.mobile ?? "",
              address: client.address ?? "",
              city: client.city ?? "",
              province: client.province ?? "",
              postalCode: client.postalCode ?? "",
              country: client.country ?? "ES",
              notes: client.notes ?? "",
            }
          : { country: "ES", clientType: "EMPRESA" }
      );
    }
  }, [open, client, reset]);

  async function onSubmit(data: FormData) {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined)
    );
    if (isEditing) {
      await updateClient.mutateAsync(clean);
    } else {
      await createClient.mutateAsync(clean);
    }
    onOpenChange(false);
  }

  const isPending = createClient.isPending || updateClient.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("form.dialogTitleEdit") : t("form.dialogTitleNew")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre + Razon social */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("form.nameLabel")}</Label>
              <Input id="name" {...register("name")} placeholder="Acme Corp SL" />
              {errors.name && (
                <p className="text-xs text-destructive">{t("form.nameRequired")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legalName">{t("form.legalName")}</Label>
              <Input id="legalName" {...register("legalName")} placeholder="Acme Corporation SL" />
            </div>
          </div>

          {/* Tipo + CIF + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="clientType">{t("form.clientType")}</Label>
              <select
                id="clientType"
                {...register("clientType")}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="EMPRESA">{t("form.clientTypeEmpresa")}</option>
                <option value="AUTONOMO">{t("form.clientTypeAutonomo")}</option>
                <option value="PARTICULAR">{t("form.clientTypeParticular")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cifNif">{t("form.cifNif")}</Label>
              <Input id="cifNif" {...register("cifNif")} placeholder="B12345678" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("form.email")}</Label>
              <Input id="email" type="email" {...register("email")} placeholder="contacto@empresa.com" />
              {errors.email && (
                <p className="text-xs text-destructive">{t("form.emailInvalid")}</p>
              )}
            </div>
          </div>

          {/* Telefonos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("form.phone")}</Label>
              <Input id="phone" {...register("phone")} placeholder="93 123 45 67" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mobile">{t("form.mobile")}</Label>
              <Input id="mobile" {...register("mobile")} placeholder="600 123 456" />
            </div>
          </div>

          {/* Direccion */}
          <div className="space-y-1.5">
            <Label htmlFor="address">{t("form.address")}</Label>
            <Input id="address" {...register("address")} placeholder="Calle Mayor 1, 2" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="city">{t("form.city")}</Label>
              <Input id="city" {...register("city")} placeholder="Barcelona" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">{t("form.postalCode")}</Label>
              <Input id="postalCode" {...register("postalCode")} placeholder="08001" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="province">{t("form.province")}</Label>
              <Input id="province" {...register("province")} placeholder="Barcelona" />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("form.notesLabel")}</Label>
            <textarea
              id="notes"
              {...register("notes")}
              placeholder={t("form.notesPlaceholder")}
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? t("form.saveChanges") : t("form.createClient")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
