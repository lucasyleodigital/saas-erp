"use client";

import { useState } from "react";
import { useClient } from "@/hooks/use-clients";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { ArrowLeft, Edit, FileText, Briefcase, Info } from "lucide-react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { ClientDialog } from "./client-dialog";
import { useTranslations } from "next-intl";

const STATUS_VARIANTS: Record<string, string> = {
  DRAFT: "secondary", SENT: "info", PAID: "success",
  PARTIAL: "warning", OVERDUE: "destructive", CANCELLED: "secondary",
};

const STATUS_T_KEYS: Record<string, string> = {
  DRAFT: "draft", SENT: "sent", PAID: "paid",
  PARTIAL: "partial", OVERDUE: "overdue", CANCELLED: "cancelled",
};

export function ClientDetail({ id }: { id: string }) {
  const t = useTranslations("clients");
  const { data: client, isLoading } = useClient(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {t("detail.notFound")}
      </div>
    );
  }

  const totalBilled = Number(client.totalBilled ?? 0);
  const totalInvoices = client._count?.invoices ?? client.invoices?.length ?? 0;
  const pendingBalance = client.invoices
    ? client.invoices
        .filter((i: any) => ["SENT", "PARTIAL", "OVERDUE"].includes(i.status))
        .reduce((s: number, i: any) => s + Number(i.total) - Number(i.paidAmount ?? 0), 0)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold shrink-0">
            {getInitials(client.name)}
          </div>
          <div>
            <h1 className="text-xl font-bold">{client.name}</h1>
            {client.cifNif && (
              <p className="text-sm text-muted-foreground">{client.cifNif}</p>
            )}
            {client.city && (
              <p className="text-xs text-muted-foreground">
                {client.city}
                {client.province ? `, ${client.province}` : ""}
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          {t("detail.edit")}
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: t("detail.totalBilled"),
            value: formatCurrency(totalBilled),
            highlight: false,
          },
          {
            label: t("detail.pendingBalance"),
            value: formatCurrency(pendingBalance),
            highlight: pendingBalance > 0,
          },
          {
            label: t("detail.totalInvoices"),
            value: String(totalInvoices),
            highlight: false,
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {kpi.label}
              </p>
              <p
                className={`text-xl font-bold mt-1 ${
                  kpi.highlight ? "text-amber-600" : ""
                }`}
              >
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="facturas">
        <TabsList>
          <TabsTrigger value="facturas">
            <FileText className="h-4 w-4 mr-2" />
            {t("detail.tabs.invoices")}
          </TabsTrigger>
          <TabsTrigger value="deals">
            <Briefcase className="h-4 w-4 mr-2" />
            {t("detail.tabs.deals")}
          </TabsTrigger>
          <TabsTrigger value="datos">
            <Info className="h-4 w-4 mr-2" />
            {t("detail.tabs.data")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facturas">
          <Card>
            <CardContent className="p-0">
              {!client.invoices || client.invoices.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  {t("detail.noInvoices")}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        {t("detail.invoiceNumber")}
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                        {t("detail.invoiceDate")}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                        {t("detail.invoiceAmount")}
                      </th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                        {t("detail.invoiceStatus")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.invoices.map((inv: any) => {
                      const variant = STATUS_VARIANTS[inv.status] ?? "secondary";
                      const statusKey = STATUS_T_KEYS[inv.status] ?? "draft";
                      return (
                        <tr
                          key={inv.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/facturas/${inv.id}`}
                              className="font-mono text-xs text-primary hover:underline"
                            >
                              {inv.number}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                            {formatDate(inv.issueDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(Number(inv.total))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={variant as any}>
                              {t(`detail.invoiceStatuses.${statusKey}`)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardContent className="p-4">
              {!client.deals || client.deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("detail.noDeals")}</p>
              ) : (
                <div className="space-y-3">
                  {client.deals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">{deal.stage}</p>
                      </div>
                      <span className="text-sm font-bold">
                        {formatCurrency(Number(deal.value))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datos">
          <Card>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {[
                  { label: t("detail.legalName"), value: client.legalName },
                  { label: t("detail.cifNif"), value: client.cifNif },
                  { label: t("detail.email"), value: client.email },
                  { label: t("detail.phone"), value: client.phone },
                  { label: t("detail.mobile"), value: client.mobile },
                  { label: t("detail.web"), value: client.website },
                  { label: t("detail.address"), value: client.address },
                  {
                    label: t("detail.city"),
                    value: client.city
                      ? `${client.city}${client.province ? `, ${client.province}` : ""}`
                      : null,
                  },
                  { label: t("detail.postalCode"), value: client.postalCode },
                  { label: t("detail.country"), value: client.country },
                ]
                  .filter((f) => f.value)
                  .map((field) => (
                    <div key={field.label}>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">
                        {field.label}
                      </dt>
                      <dd className="font-medium">{field.value}</dd>
                    </div>
                  ))}
              </dl>
              {client.notes && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    {t("detail.internalNotes")}
                  </p>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientDialog open={editOpen} onOpenChange={setEditOpen} client={client} />
    </div>
  );
}
