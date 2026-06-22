"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMyCompany, useUpdateCompany } from "@/hooks/use-company";
import { useUser } from "@/hooks/use-user";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, CreditCard, Palette, Landmark, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { TeamSection } from "@/components/empresa/team-section";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  legalName: z.string().optional(),
  cif: z.string().optional(),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  logo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PLAN_LABELS: Record<string, { label: string; description: string }> = {
  FREE: { label: "Gratuito", description: "5 clientes, 10 facturas/mes, 1 usuario" },
  STARTER: { label: "Starter", description: "50 clientes, 100 facturas/mes, 3 usuarios" },
  PRO: { label: "Pro", description: "500 clientes, 1000 facturas/mes, 10 usuarios + IA" },
  ENTERPRISE: { label: "Enterprise", description: "Sin limites, usuarios ilimitados" },
};

export function CompanySettings() {
  const { data: company, isLoading, refetch } = useMyCompany();
  const { data: currentUser } = useUser();
  const updateCompany = useUpdateCompany();

  const [invoiceColor, setInvoiceColor] = useState("#4f46e5");
  const [invoiceFooter, setInvoiceFooter] = useState("");
  const [invoiceTerms, setInvoiceTerms] = useState("");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [newBank, setNewBank] = useState({ name: "", iban: "", bic: "" });
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [addingBank, setAddingBank] = useState(false);

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
        logo: company.logo ?? "",
      });
      const s = (company as any).settings ?? {};
      setInvoiceColor(s.invoiceColor ?? "#4f46e5");
      setInvoiceFooter(s.invoiceFooter ?? "");
      setInvoiceTerms(s.invoiceTerms ?? "");
    }
  }, [company, reset]);

  useEffect(() => {
    api.get("/bank/accounts").then((r) => setBankAccounts(r.data ?? [])).catch(() => {});
  }, []);

  async function saveAppearance() {
    setSavingAppearance(true);
    try {
      const currentSettings = (company as any)?.settings ?? {};
      await api.put("/companies/me", {
        settings: { ...currentSettings, invoiceColor, invoiceFooter, invoiceTerms },
      });
      toast.success("Apariencia de facturas guardada");
      refetch();
    } catch {
      toast.error("Error al guardar");
    }
    setSavingAppearance(false);
  }

  async function addBankAccount() {
    if (!newBank.name) return;
    setAddingBank(true);
    try {
      const r = await api.post("/bank/accounts", newBank);
      setBankAccounts((prev) => [...prev, r.data]);
      setNewBank({ name: "", iban: "", bic: "" });
      toast.success("Cuenta bancaria agregada");
    } catch {
      toast.error("Error al crear cuenta");
    }
    setAddingBank(false);
  }

  async function deleteBankAccount(id: string) {
    try {
      await api.delete(`/bank/accounts/${id}`);
      setBankAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Cuenta eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi empresa</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Datos fiscales, apariencia de facturas y datos bancarios
          </p>
        </div>
        <Badge variant={plan === "FREE" ? "secondary" : "default"}>
          {planInfo.label}
        </Badge>
      </div>

      {/* Company data form */}
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
                <Input id="comp-name" {...register("name")} placeholder="Mi empresa" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-legal">Razon social</Label>
                <Input id="comp-legal" {...register("legalName")} placeholder="Mi Empresa S.L." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-cif">CIF / NIF</Label>
                <Input id="comp-cif" {...register("cif")} placeholder="B12345678" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-email">Email de contacto</Label>
                <Input id="comp-email" type="email" {...register("email")} placeholder="info@miempresa.es" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-phone">Telefono</Label>
                <Input id="comp-phone" {...register("phone")} placeholder="93 123 45 67" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-web">Pagina web</Label>
                <Input id="comp-web" {...register("website")} placeholder="https://miempresa.es" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-logo">URL del logo</Label>
              <Input id="comp-logo" {...register("logo")} placeholder="https://miempresa.es/logo.png" />
              <p className="text-xs text-muted-foreground">Sube tu logo a tu web o a un servicio como imgur.com y pega la URL aqui</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-address">Direccion fiscal</Label>
              <Input id="comp-address" {...register("address")} placeholder="Calle Mayor 1, 2a planta" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="comp-city">Ciudad</Label>
                <Input id="comp-city" {...register("city")} placeholder="Barcelona" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-cp">CP</Label>
                <Input id="comp-cp" {...register("postalCode")} placeholder="08001" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-prov">Provincia</Label>
                <Input id="comp-prov" {...register("province")} placeholder="Barcelona" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isDirty && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || updateCompany.isPending}>
              {(isSubmitting || updateCompany.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar datos
            </Button>
          </div>
        )}
      </form>

      {/* Invoice appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Apariencia de facturas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-color">Color principal</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="inv-color"
                  value={invoiceColor}
                  onChange={(e) => setInvoiceColor(e.target.value)}
                  className="h-10 w-14 rounded border border-border cursor-pointer"
                />
                <Input
                  value={invoiceColor}
                  onChange={(e) => setInvoiceColor(e.target.value)}
                  placeholder="#4f46e5"
                  className="w-32 font-mono text-sm"
                />
                <div className="h-8 flex-1 rounded" style={{ backgroundColor: invoiceColor }} />
              </div>
              <p className="text-xs text-muted-foreground">Color de cabeceras, totales y acentos en el PDF</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-footer">Pie de pagina de la factura</Label>
            <Input
              id="inv-footer"
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              placeholder="Mi Empresa S.L. · CIF: B12345678 · Inscrita en el Registro Mercantil de..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-terms">Condiciones de pago</Label>
            <Textarea
              id="inv-terms"
              value={invoiceTerms}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInvoiceTerms(e.target.value)}
              placeholder="Pago a 30 dias. Transferencia bancaria al IBAN indicado. Intereses de demora del 1,5% mensual."
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={saveAppearance} disabled={savingAppearance} variant="outline">
              {savingAppearance && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar apariencia
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bank accounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            Cuentas bancarias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">La primera cuenta activa aparecera en las facturas como datos de pago</p>

          {bankAccounts.length > 0 && (
            <div className="space-y-2">
              {bankAccounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <p className="text-sm font-medium">{acc.name}</p>
                    {acc.iban && <p className="text-xs font-mono text-muted-foreground">{acc.iban}</p>}
                    {acc.bic && <p className="text-xs text-muted-foreground">BIC: {acc.bic}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => { if (confirm("Eliminar esta cuenta?")) deleteBankAccount(acc.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre de la cuenta</Label>
              <Input
                value={newBank.name}
                onChange={(e) => setNewBank((p) => ({ ...p, name: e.target.value }))}
                placeholder="Cuenta principal"
              />
            </div>
            <div className="space-y-1.5">
              <Label>IBAN</Label>
              <Input
                value={newBank.iban}
                onChange={(e) => setNewBank((p) => ({ ...p, iban: e.target.value }))}
                placeholder="ES91 2100 0418 4502 0005 1332"
              />
            </div>
            <div className="space-y-1.5">
              <Label>BIC / SWIFT</Label>
              <Input
                value={newBank.bic}
                onChange={(e) => setNewBank((p) => ({ ...p, bic: e.target.value }))}
                placeholder="CAIXESBBXXX"
              />
            </div>
          </div>
          <Button onClick={addBankAccount} disabled={addingBank || !newBank.name} variant="outline" size="sm" className="gap-2">
            {addingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Agregar cuenta
          </Button>
        </CardContent>
      </Card>

      {/* Plan card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Plan y facturacion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Plan {planInfo.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{planInfo.description}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/billing">Cambiar plan</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <TeamSection currentRole={currentUser?.role ?? "EMPLOYEE"} />
    </div>
  );
}
