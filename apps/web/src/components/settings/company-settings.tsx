"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMyCompany, useUpdateCompany } from "@/hooks/use-company";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, CreditCard } from "lucide-react";
import Link from "next/link";
import { TeamSection } from "@/components/empresa/team-section";

const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  legalName: z.string().optional(),
  cif: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PLAN_LABELS: Record<string, { label: string; description: string }> = {
  FREE: { label: "Gratuito", description: "5 clientes, 10 facturas/mes, 1 usuario" },
  STARTER: { label: "Starter", description: "50 clientes, 100 facturas/mes, 3 usuarios" },
  PRO: { label: "Pro", description: "500 clientes, 1000 facturas/mes, 10 usuarios + IA" },
  ENTERPRISE: { label: "Enterprise", description: "Sin límites, usuarios ilimitados" },
};

export function CompanySettings() {
  const { data: company, isLoading } = useMyCompany();
  const { data: currentUser } = useUser();
  const updateCompany = useUpdateCompany();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name ?? "",
        legalName: company.legalName ?? "",
        cif: company.cif ?? "",
        email: company.email ?? "",
        phone: company.phone ?? "",
        address: company.address ?? "",
        city: company.city ?? "",
        province: company.province ?? "",
        postalCode: company.postalCode ?? "",
        country: company.country ?? "ES",
        website: company.website ?? "",
      });
    }
  }, [company, reset]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const plan = company?.plan ?? "FREE";
  const planInfo = PLAN_LABELS[plan] ?? { label: "Gratuito", description: "5 clientes, 10 facturas/mes, 1 usuario" };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi empresa</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Datos fiscales y de contacto que aparecerán en tus facturas
          </p>
        </div>
        <Badge variant={plan === "FREE" ? "secondary" : "default"}>
          {planInfo.label}
        </Badge>
      </div>

      <form
        onSubmit={handleSubmit((d) => {
          const clean = Object.fromEntries(
            Object.entries(d).filter(([, v]) => v !== "")
          );
          updateCompany.mutate(clean);
        })}
        className="space-y-4"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Datos de la empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="comp-name">Nombre comercial *</Label>
                <Input
                  id="comp-name"
                  {...register("name")}
                  placeholder="Mi empresa"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-legal">Razón social</Label>
                <Input
                  id="comp-legal"
                  {...register("legalName")}
                  placeholder="Mi Empresa Sociedad Limitada"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-cif">CIF / NIF</Label>
                <Input
                  id="comp-cif"
                  {...register("cif")}
                  placeholder="B12345678"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-email">Email de contacto</Label>
                <Input
                  id="comp-email"
                  type="email"
                  {...register("email")}
                  placeholder="info@miempresa.es"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-phone">Teléfono</Label>
                <Input
                  id="comp-phone"
                  {...register("phone")}
                  placeholder="93 123 45 67"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-web">Página web</Label>
                <Input
                  id="comp-web"
                  {...register("website")}
                  placeholder="https://miempresa.es"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-address">Dirección fiscal</Label>
              <Input
                id="comp-address"
                {...register("address")}
                placeholder="Calle Mayor 1, 2ª planta"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="comp-city">Ciudad</Label>
                <Input
                  id="comp-city"
                  {...register("city")}
                  placeholder="Barcelona"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-cp">CP</Label>
                <Input
                  id="comp-cp"
                  {...register("postalCode")}
                  placeholder="08001"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-prov">Provincia</Label>
                <Input
                  id="comp-prov"
                  {...register("province")}
                  placeholder="Barcelona"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isDirty && (
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || updateCompany.isPending}
            >
              {(isSubmitting || updateCompany.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Guardar cambios
            </Button>
          </div>
        )}
      </form>

      {/* Plan card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Plan y facturación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Plan {planInfo.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {planInfo.description}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/billing">Cambiar plan</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team section */}
      <TeamSection currentRole={currentUser?.role ?? "EMPLOYEE"} />
    </div>
  );
}
