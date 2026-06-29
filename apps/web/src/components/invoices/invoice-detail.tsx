"use client";

import { useInvoice, useUpdateInvoiceStatus, useRegisterPayment } from "@/hooks/use-invoices";
import { useGenerateVerifactu } from "@/hooks/use-verifactu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Download, Send, CheckCircle, Shield, ExternalLink, Copy } from "lucide-react";
import { downloadInvoicePdf } from "@/lib/pdf/download-pdf";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

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
  const generateVerifactu = useGenerateVerifactu();
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

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
        {t("detail.notFound")}
      </div>
    );
  }

  const config = STATUS_CONFIG[invoice.status] ?? { label: "DRAFT", variant: "secondary" as const };
  const pendingAmount = Number(invoice.total) - Number(invoice.paidAmount ?? 0);

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
              <Badge variant={config.variant as any}>{t(`detail.status${invoice.status.charAt(0) + invoice.status.slice(1).toLowerCase()}`)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{invoice.client?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              try {
                await downloadInvoicePdf(id);
              } catch {
                toast.error(t("detail.pdfDownloadError"));
              }
            }}
          >
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
              {t("detail.send")}
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
              {t("detail.registerFullPayment")}
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
                    {t("detail.issuer")}
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
                    {t("detail.recipient")}
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
                  <p className="text-muted-foreground mb-1">{t("detail.number")}</p>
                  <p className="font-mono font-medium">{invoice.number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t("detail.issueDate")}</p>
                  <p>{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t("detail.dueDate")}</p>
                  <p>{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
                </div>
              </div>

              {/* Line items */}
              {(() => {
                const ivaTaxes = (invoice.taxes ?? []).filter((tx: any) => Number(tx.rate) > 0);
                const irpfTaxes = (invoice.taxes ?? []).filter((tx: any) => Number(tx.rate) < 0);
                const hasIrpf = irpfTaxes.length > 0;
                const irpfRate = hasIrpf ? Math.abs(Number(irpfTaxes[0].rate)) : 0;
                const ivaRate = ivaTaxes.length > 0 ? Number(ivaTaxes[0].rate) : 0;

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm mb-6">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="text-left py-2 pr-4 font-medium">{tCommon("description")}</th>
                            <th className="text-right py-2 px-2 font-medium">{t("detail.qty")}</th>
                            <th className="text-right py-2 px-2 font-medium">{t("detail.price")}</th>
                            <th className="text-right py-2 px-2 font-medium">{t("detail.discount")}</th>
                            {ivaRate > 0 && <th className="text-right py-2 px-2 font-medium">{tCommon("tax")}</th>}
                            {hasIrpf && <th className="text-right py-2 px-2 font-medium">{t("detail.irpf")}</th>}
                            <th className="text-right py-2 pl-2 font-medium">{tCommon("amount")}</th>
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
                              {ivaRate > 0 && (
                                <td className="py-2.5 px-2 text-right text-muted-foreground">{ivaRate}%</td>
                              )}
                              {hasIrpf && (
                                <td className="py-2.5 px-2 text-right text-muted-foreground">{irpfRate}%</td>
                              )}
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
                      <div className="w-72 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("detail.taxBase")}</span>
                          <span>{formatCurrency(Number(invoice.subtotal))}</span>
                        </div>
                        {ivaTaxes.map((tx: any) => (
                          <div key={tx.id} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {tx.tax?.name ?? `IVA ${tx.rate}%`} (s/{formatCurrency(Number(tx.base ?? invoice.subtotal))})
                            </span>
                            <span>{formatCurrency(Number(tx.amount))}</span>
                          </div>
                        ))}
                        {ivaTaxes.length === 0 && Number(invoice.taxAmount) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{tCommon("tax")}</span>
                            <span>{formatCurrency(Number(invoice.taxAmount))}</span>
                          </div>
                        )}
                        {irpfTaxes.map((tx: any) => (
                          <div key={tx.id} className="flex justify-between text-red-600">
                            <span>{t("detail.withholding")} {tx.tax?.name ?? `IRPF ${Math.abs(Number(tx.rate))}%`}</span>
                            <span>{formatCurrency(Number(tx.amount))}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
                          <span>{t("detail.invoiceTotal")}</span>
                          <span>{formatCurrency(Number(invoice.total))}</span>
                        </div>
                        {Number(invoice.paidAmount ?? 0) > 0 && (
                          <>
                            <div className="flex justify-between text-emerald-600 text-xs">
                              <span>{t("detail.collected")}</span>
                              <span>{formatCurrency(Number(invoice.paidAmount))}</span>
                            </div>
                            {pendingAmount > 0 && (
                              <div className="flex justify-between font-semibold text-amber-600 text-xs">
                                <span>{tCommon("pending")}</span>
                                <span>{formatCurrency(pendingAmount)}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              {invoice.notes && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">{tCommon("notes")}</p>
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
              <CardTitle className="text-sm">{t("detail.paymentHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {!invoice.payments || invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("detail.noPayments")}</p>
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
                <div className="space-y-3">
                  <Badge variant={"success" as any} className="w-full justify-center">
                    {t("detail.verifactuGenerated")}
                  </Badge>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tCommon("status")}</span>
                      <span className="font-medium">{invoice.verifactu.status}</span>
                    </div>
                    {invoice.verifactu.hash && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Hash</p>
                        <div className="flex items-center gap-1">
                          <p className="font-mono text-[10px] break-all flex-1 bg-muted/50 rounded p-1">
                            {invoice.verifactu.hash.slice(0, 32)}...
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(invoice.verifactu!.hash);
                              toast.success(t("detail.hashCopied"));
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {invoice.verifactu.qrCode && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-xs"
                        asChild
                      >
                        <a href={invoice.verifactu.qrCode} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                          {t("detail.verifyAeat")}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {t("detail.verifactuHint")}
                  </p>
                  {["SENT", "PAID"].includes(invoice.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-xs"
                      disabled={generateVerifactu.isPending}
                      onClick={() => generateVerifactu.mutate(id)}
                    >
                      <Shield className="h-3 w-3" />
                      {generateVerifactu.isPending ? tCommon("generating") : t("detail.generateVerifactu")}
                    </Button>
                  )}
                  {invoice.status === "DRAFT" && (
                    <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded p-2">
                      {t("detail.sendFirstForVerifactu")}
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
                <span className="text-muted-foreground">{t("detail.series")}</span>
                <span className="font-mono">{invoice.series?.prefix ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("detail.currency")}</span>
                <span>{invoice.currency ?? "EUR"}</span>
              </div>
              {invoice.client?.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("detail.clientEmail")}</span>
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
