"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useProfitAndLoss, useVatReport, useJournalEntries,
  useCreateJournalEntry, useDeleteJournalEntry, useAccounts,
  useLibroFacturas, useModelo130, useModelo347, useRetenciones,
  useBackfillTaxes, useDeleteAccount,
} from "@/hooks/use-accounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Loader2, BookOpen, Receipt, TrendingUp, Calculator, FileText, Users as UsersIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// ---- Journal entry dialog ----
const entrySchema = z.object({
  date: z.string().min(1, "Fecha obligatoria"),
  description: z.string().min(1, "Descripción obligatoria"),
  items: z.array(z.object({
    accountId: z.string().min(1, "Cuenta obligatoria"),
    debit: z.coerce.number().min(0),
    credit: z.coerce.number().min(0),
    description: z.string().optional(),
  })).min(2, "Mínimo 2 líneas"),
});
type EntryForm = z.infer<typeof entrySchema>;

function JournalEntryDialog({
  open, onOpenChange, accounts,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; accounts: any[];
}) {
  const create = useCreateJournalEntry();
  const {
    register, handleSubmit, control, watch, reset, formState: { errors },
  } = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      items: [
        { accountId: "", debit: 0, credit: 0, description: "" },
        { accountId: "", debit: 0, credit: 0, description: "" },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const totalDebit = items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
  const totalCredit = items.reduce((s, i) => s + (Number(i.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  async function onSubmit(data: EntryForm) {
    await create.mutateAsync(data as any);
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo asiento contable</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input type="date" {...register("date")} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Input {...register("description")} placeholder="Pago de proveedor..." />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
          </div>

          {/* Lines */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
              <span className="col-span-4">Cuenta</span>
              <span className="col-span-3">Descripción</span>
              <span className="col-span-2 text-right">Debe</span>
              <span className="col-span-2 text-right">Haber</span>
              <span className="col-span-1" />
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <select
                    {...register(`items.${idx}.accountId`)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Cuenta...</option>
                    {accounts.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <Input
                    className="h-9 text-xs"
                    placeholder="Concepto"
                    {...register(`items.${idx}.description`)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number" step="0.01" min="0" className="h-9 text-xs text-right"
                    {...register(`items.${idx}.debit`)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number" step="0.01" min="0" className="h-9 text-xs text-right"
                    {...register(`items.${idx}.credit`)}
                  />
                </div>
                <div className="col-span-1 flex justify-center items-center">
                  {fields.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                      onClick={() => remove(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button" variant="outline" size="sm" className="gap-2 text-xs"
              onClick={() => append({ accountId: "", debit: 0, credit: 0, description: "" })}
            >
              <Plus className="h-3.5 w-3.5" /> Añadir línea
            </Button>
          </div>

          {/* Totals */}
          <div className="flex items-center justify-end gap-6 text-sm border-t pt-3">
            <div className="flex gap-4">
              <span>Debe: <strong>{formatCurrency(totalDebit)}</strong></span>
              <span>Haber: <strong>{formatCurrency(totalCredit)}</strong></span>
            </div>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              balanced ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"
            )}>
              {balanced ? "Cuadrado" : "Descuadrado"}
            </span>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || !balanced}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Crear asiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main view ----
export function AccountingView() {
  const t = useTranslations("accounting");
  const [tab, setTab] = useState<"pyl" | "vat" | "journal" | "accounts" | "libro" | "modelo130" | "modelo347" | "retenciones">("pyl");
  const [year, setYear] = useState(new Date().getFullYear());
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);

  const { data: pyl, isLoading: pylLoading } = useProfitAndLoss(year);
  const { data: vat, isLoading: vatLoading } = useVatReport(year);
  const { data: journalData, isLoading: journalLoading } = useJournalEntries({});
  const deleteEntry = useDeleteJournalEntry();
  const { data: accountsData } = useAccounts();
  const backfillTaxes = useBackfillTaxes();
  const deleteAccount = useDeleteAccount();

  const { data: libro, isLoading: libroLoading } = useLibroFacturas(year);
  const { data: modelo130, isLoading: m130Loading } = useModelo130(year);
  const { data: modelo347, isLoading: m347Loading } = useModelo347(year);
  const { data: retenciones, isLoading: retLoading } = useRetenciones(year);

  const accounts: any[] = accountsData ?? [];
  const entries: any[] = journalData?.data ?? [];

  const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const chartData = pyl?.monthly?.map((m: any, i: number) => ({
    mes: MONTHS[i],
    Ingresos: m.revenue,
    Gastos: m.expenses,
  })) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg overflow-hidden">
            <button
              onClick={() => setYear(y => y - 1)}
              className="px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >‹</button>
            <span className="px-3 py-1.5 text-sm font-medium border-x">{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              className="px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >›</button>
          </div>
          {tab === "journal" && (
            <Button size="sm" className="gap-2" onClick={() => setEntryDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Asiento
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit overflow-x-auto">
        {[
          { key: "pyl", label: "Pérdidas y Ganancias", icon: TrendingUp },
          { key: "vat", label: "IVA Trimestral", icon: Calculator },
          { key: "journal", label: "Libro Diario", icon: BookOpen },
          { key: "accounts", label: "Plan de Cuentas", icon: Receipt },
          { key: "libro", label: "Libro Facturas", icon: FileText },
          { key: "modelo130", label: "Modelo 130", icon: Calculator },
          { key: "modelo347", label: "Modelo 347", icon: UsersIcon },
          { key: "retenciones", label: "Retenciones IRPF", icon: Receipt },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              tab === t.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* P&L tab */}
      {tab === "pyl" && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Ingresos", value: pyl?.revenue ?? 0, color: "text-emerald-600" },
              { label: "Gastos", value: pyl?.expenses ?? 0, color: "text-destructive" },
              { label: "Resultado neto", value: pyl?.profit ?? 0, color: (pyl?.profit ?? 0) >= 0 ? "text-emerald-600" : "text-destructive" },
            ].map((c) => (
              <Card key={c.label}>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={cn("text-2xl font-bold mt-1", c.color)}>
                    {formatCurrency(c.value)}
                  </p>
                  {c.label === "Resultado neto" && pyl?.margin !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">Margen: {pyl.margin.toFixed(1)}%</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolución mensual {year}</CardTitle>
            </CardHeader>
            <CardContent>
              {pylLoading ? (
                <div className="h-64 bg-muted rounded-lg animate-pulse" />
              ) : chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  Sin datos para {year}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="Ingresos" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gastos" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VAT tab */}
      {tab === "vat" && (
        <div className="space-y-4">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Si el IVA sale a 0 con facturas existentes, pulsa "Reparar" para crear los registros de impuestos que faltan.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => backfillTaxes.mutate()}
                disabled={backfillTaxes.isPending}
              >
                {backfillTaxes.isPending ? "Reparando..." : "Reparar impuestos"}
              </Button>
            </CardContent>
          </Card>
          {vatLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(vat?.quarters ?? []).map((q: any) => (
                  <Card key={q.quarter}>
                    <CardContent className="p-5">
                      <p className="text-sm font-semibold text-muted-foreground mb-3">{q.quarter} {year}</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base</span>
                          <span className="font-medium">{formatCurrency(q.base)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IVA (21%)</span>
                          <span className="font-medium text-amber-600">{formatCurrency(q.vat)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5">
                          <span className="font-semibold">Total</span>
                          <span className="font-bold">{formatCurrency(q.total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Annual total */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Total IVA a declarar {year}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Modelos 303 anuales</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(vat?.yearTotal?.vat ?? 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      sobre {formatCurrency(vat?.yearTotal?.base ?? 0)} de base
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Journal tab */}
      {tab === "journal" && (
        <Card>
          <CardContent className="p-0">
            {journalLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Sin asientos</p>
                <p className="text-sm text-muted-foreground mt-1">Crea el primer asiento contable</p>
                <Button className="mt-4 gap-2" onClick={() => setEntryDialogOpen(true)}>
                  <Plus className="h-4 w-4" /> Nuevo asiento
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Fecha</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Descripción</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Tipo</th>
                      <th className="text-right p-4 text-xs font-medium text-muted-foreground">Importe</th>
                      <th className="text-right p-4 text-xs font-medium text-muted-foreground">Estado</th>
                      <th className="p-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry: any, i: number) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString("es-ES")}
                        </td>
                        <td className="p-4 text-sm font-medium">{entry.description}</td>
                        <td className="p-4 text-xs text-muted-foreground">{entry.type}</td>
                        <td className="p-4 text-right text-sm font-semibold">
                          {formatCurrency(
                            entry.items?.reduce((s: number, it: any) => s + Number(it.debit || 0), 0) ?? 0
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            entry.isLocked ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {entry.isLocked ? "Bloqueado" : "Borrador"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {!entry.isLocked && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteEntry.mutate(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Accounts tab */}
      {tab === "accounts" && (
        <Card>
          <CardContent className="p-0">
            {accounts.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Plan de cuentas vacio</p>
                <p className="text-sm text-muted-foreground mt-1">
                  El plan de cuentas PGC se crea automaticamente. Ve a Libro Diario y crea un asiento para inicializarlo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Codigo</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Nombre</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Grupo</th>
                      <th className="p-4 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {accounts
                      .sort((a: any, b: any) => a.code.localeCompare(b.code))
                      .map((account: any, i: number) => (
                        <motion.tr
                          key={account.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.01 }}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 font-mono text-sm font-semibold text-primary">{account.code}</td>
                          <td className="p-4 text-sm font-medium">{account.name}</td>
                          <td className="p-4 text-xs text-muted-foreground">{account.type}</td>
                          <td className="p-4 text-xs text-muted-foreground">{account.code.charAt(0)}</td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                if (confirm(`Eliminar cuenta ${account.code} - ${account.name}?`)) {
                                  deleteAccount.mutate(account.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Libro Facturas tab */}
      {tab === "libro" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Facturas Emitidas</CardTitle></CardHeader>
            <CardContent className="p-0">
              {libroLoading ? (
                <div className="h-32 animate-pulse bg-muted m-4 rounded-lg" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Numero</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">CIF/NIF</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Base</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">IVA</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(libro?.emitidas ?? []).map((inv: any) => (
                        <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-3 font-mono text-xs">{inv.number}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(inv.issueDate).toLocaleDateString("es-ES")}</td>
                          <td className="px-4 py-3 font-medium">{inv.clientName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{inv.clientCif ?? "—"}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(inv.subtotal)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(inv.taxAmount)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.total)}</td>
                        </tr>
                      ))}
                      {(libro?.emitidas ?? []).length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Sin facturas emitidas en {year}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Facturas Recibidas</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Numero</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Proveedor</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Base</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">IVA</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(libro?.recibidas ?? []).map((inv: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs">{inv.number ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(inv.date).toLocaleDateString("es-ES")}</td>
                        <td className="px-4 py-3 font-medium">{inv.supplierName}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(inv.subtotal)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(inv.taxAmount)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.total)}</td>
                      </tr>
                    ))}
                    {(libro?.recibidas ?? []).length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin facturas recibidas en {year}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modelo 130 tab */}
      {tab === "modelo130" && (
        <div className="space-y-4">
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-5">
              <p className="text-sm font-medium">Modelo 130 — Pago fraccionado IRPF</p>
              <p className="text-xs text-muted-foreground mt-1">Estimacion directa simplificada. Autonomos obligados a presentar trimestralmente.</p>
            </CardContent>
          </Card>
          {m130Loading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(modelo130?.quarters ?? []).map((q: any) => (
                  <Card key={q.quarter}>
                    <CardContent className="p-5">
                      <p className="text-sm font-semibold text-muted-foreground mb-3">{q.quarter} {year}</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ingresos</span>
                          <span>{formatCurrency(q.revenue ?? 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gastos</span>
                          <span>{formatCurrency(q.expenses ?? 0)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="text-muted-foreground">Rto. neto</span>
                          <span className="font-medium">{formatCurrency(q.netIncome ?? 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IRPF ({q.irpfRate ?? 20}%)</span>
                          <span className="text-amber-600 font-medium">{formatCurrency(q.irpfAmount ?? 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pagos ant.</span>
                          <span>{formatCurrency(q.previousPayments ?? 0)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5 font-bold">
                          <span>A ingresar</span>
                          <span className="text-primary">{formatCurrency(q.toPay ?? 0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Total Modelo 130 — {year}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Pagos fraccionados IRPF acumulados</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(modelo130?.yearTotal?.toPay ?? 0)}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Modelo 347 tab */}
      {tab === "modelo347" && (
        <div className="space-y-4">
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-5">
              <p className="text-sm font-medium">Modelo 347 — Operaciones con terceros</p>
              <p className="text-xs text-muted-foreground mt-1">Declaracion anual de operaciones superiores a 3.005,06 EUR con un mismo cliente o proveedor.</p>
            </CardContent>
          </Card>
          {m347Loading ? (
            <div className="h-40 bg-muted rounded-xl animate-pulse" />
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Clientes ({modelo347?.clients?.length ?? 0})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">CIF/NIF</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total operaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(modelo347?.clients ?? []).map((c: any) => (
                          <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{c.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{c.cifNif ?? "—"}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(c.total)}</td>
                          </tr>
                        ))}
                        {(modelo347?.clients ?? []).length === 0 && (
                          <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Ningun cliente supera los 3.005,06 EUR en {year}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Proveedores ({modelo347?.suppliers?.length ?? 0})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Proveedor</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">CIF/NIF</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total operaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(modelo347?.suppliers ?? []).map((s: any) => (
                          <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{s.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{s.cifNif ?? "—"}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(s.total)}</td>
                          </tr>
                        ))}
                        {(modelo347?.suppliers ?? []).length === 0 && (
                          <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Ningun proveedor supera los 3.005,06 EUR en {year}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Retenciones IRPF tab */}
      {tab === "retenciones" && (
        <div className="space-y-4">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-5">
              <p className="text-sm font-medium">Retenciones IRPF practicadas</p>
              <p className="text-xs text-muted-foreground mt-1">Resumen de retenciones aplicadas en facturas emitidas. Util para el Modelo 190.</p>
            </CardContent>
          </Card>
          {retLoading ? (
            <div className="h-40 bg-muted rounded-xl animate-pulse" />
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">CIF/NIF</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Base</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">% IRPF</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Retencion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(retenciones?.retentions ?? []).map((r: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{r.clientName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{r.cifNif ?? "—"}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(r.base)}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{r.rate}%</td>
                            <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(r.amount)}</td>
                          </tr>
                        ))}
                        {(retenciones?.retentions ?? []).length === 0 && (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin retenciones IRPF en {year}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              {retenciones?.total && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Total retenciones {year}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">Base: {formatCurrency(retenciones.total.base ?? 0)}</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(retenciones.total.amount ?? 0)}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      <JournalEntryDialog
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        accounts={accounts}
      />
    </div>
  );
}
