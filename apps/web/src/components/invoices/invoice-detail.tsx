"use client";

import { useInvoice, useUpdateInvoiceStatus, useRegisterPayment } from "@/hooks/use-invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Download, Send, CheckCircle, Shield } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  SENT: { label: "Enviada", variant: "info" },
  PAID: { label: "Pagada", variant: "success" },
  PARTIAL: { label: "Parcial", variant: "warning" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
};

export function InvoiceDetail({ id }: { id: string }) {
  const { data: invoice, isLoading } = useInvoice(id);
  const updateStatus = useUpdateInvoiceStatus();
  const registerPayment = useRegisterPayment();
  const [generatingVerifactu, setGeneratingVerifactu] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Factura no encontrada
      </div>
    );
  }

  const config = STATUS_CONFIG[invoice.status] ?? { label: "Borrador", variant: "secondary" as const };
  const pendingAmount = Number(invoice.total) - Number(invoice.paidAmount ?? 0);

  async function handleGenerateVerifactu() {
    setGeneratingVerifactu(true);
    try {
      await api.post(`/verifactu/generate/${id}`);
      toast.success("VeriFactu generado correctamente");
    } catch {
      toast.error("Error al generar VeriFactu");
    } finally {
      setGeneratingVerifactu(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/facturas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono">{invoice.number}</h1>
              <Badge variant={config.variant as any}>{config.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{invoice.client?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
          {invoice.status === "DRAFT" && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => updateStatus.mutate({ id, status: "SENT" })}
              disabled={updateStatus.isPending}
            >
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          )}
          {["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status) && (
            <Button
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={registerPayment.isPending}
              onClick={() =>
                registerPayment.mutate({
                  invoiceId: id,
                  amount: pendingAmount,
                  method: "BANK_TRANSFER",
                })
              }
            >
              <CheckCircle className="h-4 w-4" />
              Registrar pago completo
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main invoice */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              {/* Parties */}
              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Emisor
                  </p>
                  <p className="font-semibold">
                    {invoice.company?.legalName ?? invoice.company?.name ?? "—"}
                  </p>
                  {invoice.company?.cif && (
                    <p className="text-sm text-muted-foreground">{invoice.company.cif}</p>
                  )}
                  {invoice.company?.address && (
                    <p className="text-sm text-muted-foreground">{invoice.company.address}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Receptor
                  </p>
                  <p className="font-semibold">
                    {invoice.client?.legalName ?? invoice.client?.name ?? "—"}
                  </p>
                  {invoice.client?.cifNif && (
                    <p className="text-sm text-muted-foreground">{invoice.client.cifNif}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Número</p>
                  <p className="font-mono font-medium">{invoice.number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Fecha emisión</p>
                  <p>{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Vencimiento</p>
                  <p>{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
                </div>
              </div>

              {/* Line items */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm mb-6">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 pr-4 font-medium">Descripción</th>
                      <th className="text-right py-2 px-2 font-medium">Cant.</th>
                      <th className="text-right py-2 px-2 font-medium">Precio</th>
                      <th className="text-right py-2 px-2 font-medium">Dto.</th>
                      <th className="text-right py-2 pl-2 font-medium">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item: any) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-2.5 pr-4">{item.description}</td>
                        <td className="py-2.5 px-2 text-right">
                          {Number(item.quantity)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {formatCurrency(Number(item.unitPrice))}
                        </td>
                        <td className="py-2.5 px-2 text-right text-muted-foreground">
                          {Number(item.discount) > 0 ? `${Number(item.discount)}%` : "—"}
                        </td>
                        <td className="py-2.5 pl-2 text-right font-medium">
                          {formatCurrency(Number(item.subtotal))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(Number(invoice.subtotal))}</span>
                  </div>
                  {invoice.taxes?.map((t: any) => (
                    <div key={t.id} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t.tax?.name ?? `IVA ${t.rate}%`}
                      </span>
                      <span>{formatCurrency(Number(t.amount))}</span>
                    </div>
                  ))}
                  {/* Fallback if no tax breakdown */}
                  {(!invoice.taxes || invoice.taxes.length === 0) &&
                    Number(invoice.taxAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IVA</span>
                        <span>{formatCurrency(Number(invoice.taxAmount))}</span>
                      </div>
                    )}
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(Number(invoice.total))}</span>
                  </div>
                  {Number(invoice.paidAmount ?? 0) > 0 && (
                    <>
                      <div className="flex justify-between text-emerald-600 text-xs">
                        <span>Cobrado</span>
                        <span>{formatCurrency(Number(invoice.paidAmount))}</span>
                      </div>
                      {pendingAmount > 0 && (
                        <div className="flex justify-between font-semibold text-amber-600 text-xs">
                          <span>Pendiente</span>
                          <span>{formatCurrency(pendingAmount)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Payment history */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Historial de pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {!invoice.payments || invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
              ) : (
                <div className="space-y-2">
                  {invoice.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatDate(p.paidAt)}
                      </span>
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(Number(p.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* VeriFactu */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                VeriFactu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.verifactu ? (
                <div className="space-y-2">
                  <Badge variant={"success" as any}>Registrada en AEAT</Badge>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium">Estado:</span>{" "}
                      {invoice.verifactu.status ?? "GENERATED"}
                    </p>
                    {invoice.verifactu.hash && (
                      <p className="font-mono break-all">
                        {invoice.verifactu.hash.slice(0, 24)}...
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Esta factura no tiene registro VeriFactu todavía.
                  </p>
                  {["SENT", "PAID"].includes(invoice.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-xs"
                      disabled={generatingVerifactu}
                      onClick={handleGenerateVerifactu}
                    >
                      <Shield className="h-3 w-3" />
                      {generatingVerifactu ? "Generando..." : "Generar VeriFactu"}
                    </Button>
                  )}
                  {invoice.status === "DRAFT" && (
                    <p className="text-xs text-muted-foreground">
                      Envía la factura primero para poder registrarla.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick info */}
          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serie</span>
                <span className="font-mono">{invoice.series?.prefix ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Moneda</span>
                <span>{invoice.currency ?? "EUR"}</span>
              </div>
              {invoice.client?.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email cliente</span>
                  <a
                    href={`mailto:${invoice.client.email}`}
                    className="text-primary hover:underline text-xs truncate max-w-[140px]"
                  >
                    {invoice.client.email}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
