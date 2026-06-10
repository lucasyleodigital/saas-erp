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

const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  legalName: z.string().optional(),
  cifNif: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
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
          : { country: "ES" }
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
          <DialogTitle>{isEditing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre + Razón social */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre / Empresa *</Label>
              <Input id="name" {...register("name")} placeholder="Acme Corp SL" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legalName">Razón social</Label>
              <Input id="legalName" {...register("legalName")} placeholder="Acme Corporation SL" />
            </div>
          </div>

          {/* CIF + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cifNif">CIF / NIF</Label>
              <Input id="cifNif" {...register("cifNif")} placeholder="B12345678" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="contacto@empresa.com" />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Teléfonos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register("phone")} placeholder="93 123 45 67" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mobile">Móvil</Label>
              <Input id="mobile" {...register("mobile")} placeholder="600 123 456" />
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" {...register("address")} placeholder="Calle Mayor 1, 2º" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" {...register("city")} placeholder="Barcelona" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">CP</Label>
              <Input id="postalCode" {...register("postalCode")} placeholder="08001" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" {...register("province")} placeholder="Barcelona" />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas internas</Label>
            <textarea
              id="notes"
              {...register("notes")}
              placeholder="Notas privadas sobre este cliente..."
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
