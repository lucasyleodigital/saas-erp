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
import { Loader2, Building2, CreditCard, Palette, Landmark, Plus, Trash2, Scale } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { TeamSection } from "@/components/empresa/team-section";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

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

const PLAN_KEYS: Record<string, { labelKey: string; descKey: string }> = {
  FREE: { labelKey: "plans.free", descKey: "plans.freeDesc" },
  STARTER: { labelKey: "plans.starter", descKey: "plans.starterDesc" },
  PRO: { labelKey: "plans.pro", descKey: "plans.proDesc" },
  ENTERPRISE: { labelKey: "plans.enterprise", descKey: "plans.enterpriseDesc" },
};

export function CompanySettings() {
  const t = useTranslations("company");
  const tCommon = useTranslations("common");
  const { data: company, isLoading, refetch } = useMyCompany();
  const { data: currentUser } = useUser();
  const updateCompany = useUpdateCompany();

  const [invoiceColor, setInvoiceColor] = useState("#4f46e5");
  const [invoiceFooter, setInvoiceFooter] = useState("");
  const [invoiceTerms, setInvoiceTerms] = useState("");
  const [companyType, setCompanyType] = useState("SL");
  const [taxRegime, setTaxRegime] = useState("SIMPLIFICADA");
  const [irpfRate, setIrpfRate] = useState(15);
  const [autoApplyIrpf, setAutoApplyIrpf] = useState(false);
  const [autonomoStartDate, setAutonomoStartDate] = useState("");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [newBank, setNewBank] = useState({ name: "", iban: "", bic: "" });
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [savingFiscal, setSavingFiscal] = useState(false);
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
      setCompanyType(s.companyType ?? "SL");
      setTaxRegime(s.taxRegime ?? "SIMPLIFICADA");
      setIrpfRate(s.irpfRate ?? 15);
      setAutoApplyIrpf(s.autoApplyIrpf ?? false);
      setAutonomoStartDate(s.autonomoStartDate ?? "");
    }
  }, [company, reset]);

  useEffect(() => {
    api.get("/bank/accounts").then((r) => setBankAccounts(r.data ?? [])).catch(() => {});
  }, []);

  async function saveFiscal() {
    setSavingFiscal(true);
    try {
      const currentSettings = (company as any)?.settings ?? {};
      await api.put("/companies/me", {
        settings: { ...currentSettings, companyType, taxRegime, irpfRate, autoApplyIrpf, autonomoStartDate: autonomoStartDate || undefined },
      });
      toast.success(t("fiscal.savedSuccess"));
      refetch();
    } catch {
      toast.error(t("saveError"));
    }
    setSavingFiscal(false);
  }

  async function saveAppearance() {
    setSavingAppearance(true);
    try {
      const currentSettings = (company as any)?.settings ?? {};
      await api.put("/companies/me", {
        settings: { ...currentSettings, invoiceColor, invoiceFooter, invoiceTerms },
      });
      toast.success(t("appearance.savedSuccess"));
      refetch();
    } catch {
      toast.error(t("saveError"));
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
      toast.success(t("bank.addedSuccess"));
    } catch {
      toast.error(t("bank.addError"));
    }
    setAddingBank(false);
  }

  async function deleteBankAccount(id: string) {
    try {
      await api.delete(`/bank/accounts/${id}`);
      setBankAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.success(t("bank.deletedSuccess"));
    } catch {
      toast.error(t("bank.deleteError"));
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
  const planKeys = PLAN_KEYS[plan] ?? PLAN_KEYS.FREE!;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pageSubtitle")}
          </p>
        </div>
        <Badge variant={plan === "FREE" ? "secondary" : "default"}>
          {t(planKeys.labelKey)}
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
              {t("companyData")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="comp-name">{t("form.tradeName")}</Label>
                <Input id="comp-name" {...register("name")} placeholder="Mi empresa" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-legal">{t("form.legalName")}</Label>
                <Input id="comp-legal" {...register("legalName")} placeholder="Mi Empresa S.L." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-cif">{t("form.cifNif")}</Label>
                <Input id="comp-cif" {...register("cif")} placeholder="B12345678" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-email">{t("form.contactEmail")}</Label>
                <Input id="comp-email" type="email" {...register("email")} placeholder="info@miempresa.es" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-phone">{tCommon("phone")}</Label>
                <Input id="comp-phone" {...register("phone")} placeholder="93 123 45 67" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-web">{t("website")}</Label>
                <Input id="comp-web" {...register("website")} placeholder="https://miempresa.es" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-logo">{t("form.logoUrl")}</Label>
              <Input id="comp-logo" {...register("logo")} placeholder="https://miempresa.es/logo.png" />
              <p className="text-xs text-muted-foreground">{t("form.logoHint")}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-address">{t("address")}</Label>
              <Input id="comp-address" {...register("address")} placeholder="Calle Mayor 1, 2a planta" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="comp-city">{tCommon("city")}</Label>
                <Input id="comp-city" {...register("city")} placeholder="Barcelona" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-cp">{tCommon("postalCode")}</Label>
                <Input id="comp-cp" {...register("postalCode")} placeholder="08001" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-prov">{tCommon("province")}</Label>
                <Input id="comp-prov" {...register("province")} placeholder="Barcelona" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isDirty && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || updateCompany.isPending}>
              {(isSubmitting || updateCompany.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("form.saveData")}
            </Button>
          </div>
        )}
      </form>

      {/* Fiscal / Autonomo config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            {t("fiscal.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("fiscal.entityType")}</Label>
              <select
                value={companyType}
                onChange={(e) => {
                  setCompanyType(e.target.value);
                  if (e.target.value === "AUTONOMO") setAutoApplyIrpf(true);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="AUTONOMO">{t("fiscal.types.autonomo")}</option>
                <option value="SL">{t("fiscal.types.sl")}</option>
                <option value="SA">{t("fiscal.types.sa")}</option>
                <option value="COOPERATIVA">{t("fiscal.types.cooperativa")}</option>
                <option value="ASOCIACION">{t("fiscal.types.asociacion")}</option>
                <option value="COMUNIDAD_BIENES">{t("fiscal.types.comunidadBienes")}</option>
              </select>
            </div>

            {companyType === "AUTONOMO" && (
              <div className="space-y-1.5">
                <Label>{t("fiscal.taxRegime")}</Label>
                <select
                  value={taxRegime}
                  onChange={(e) => setTaxRegime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="SIMPLIFICADA">{t("fiscal.regimes.simplified")}</option>
                  <option value="NORMAL">{t("fiscal.regimes.normal")}</option>
                  <option value="MODULOS">{t("fiscal.regimes.modules")}</option>
                </select>
              </div>
            )}
          </div>

          {companyType === "AUTONOMO" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("fiscal.irpfRate")}</Label>
                  <select
                    value={irpfRate}
                    onChange={(e) => setIrpfRate(Number(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value={7}>{t("fiscal.rates.new7")}</option>
                    <option value={15}>{t("fiscal.rates.general15")}</option>
                    <option value={1}>{t("fiscal.rates.modules1")}</option>
                    <option value={2}>{t("fiscal.rates.modules2")}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("fiscal.autonomoStartDate")}</Label>
                  <Input
                    type="date"
                    value={autonomoStartDate}
                    onChange={(e) => setAutonomoStartDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{t("fiscal.autonomoStartDateHint")}</p>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoApplyIrpf}
                      onChange={(e) => setAutoApplyIrpf(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm">{t("fiscal.autoApplyIrpf")}</span>
                  </label>
                </div>
              </div>
              <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                <p className="text-xs text-blue-400">
                  {t("fiscal.irpfInfo", { rate: irpfRate })}
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={saveFiscal} disabled={savingFiscal} variant="outline">
              {savingFiscal && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("fiscal.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            {t("appearance.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-color">{t("appearance.primaryColor")}</Label>
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
              <p className="text-xs text-muted-foreground">{t("appearance.colorHint")}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-footer">{t("appearance.invoiceFooter")}</Label>
            <Input
              id="inv-footer"
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              placeholder="Mi Empresa S.L. · CIF: B12345678 · Inscrita en el Registro Mercantil de..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-terms">{t("appearance.paymentTerms")}</Label>
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
              {t("appearance.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bank accounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            {t("bank.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">{t("bank.hint")}</p>

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
                    onClick={() => { if (confirm(t("bank.confirmDelete"))) deleteBankAccount(acc.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>{t("bank.accountName")}</Label>
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
            {t("bank.addAccount")}
          </Button>
        </CardContent>
      </Card>

      {/* Plan card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            {t("planAndBilling")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("planLabel", { plan: t(planKeys.labelKey) })}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{t(planKeys.descKey)}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/billing">{t("changePlan")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <TeamSection currentRole={currentUser?.role ?? "EMPLOYEE"} />
    </div>
  );
}
