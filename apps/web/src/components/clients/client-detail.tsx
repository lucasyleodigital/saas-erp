"use client";

import { useState } from "react";
import { useClient } from "@/hooks/use-clients";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { ArrowLeft, Edit, FileText, Briefcase, Info } from "lucide-react";
import Link from "next/link";
import { ClientDialog } from "./client-dialog";

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  SENT: { label: "Enviada", variant: "info" },
  PAID: { label: "Pagada", variant: "success" },
  PARTIAL: { label: "Parcial", variant: "warning" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
};

export function ClientDetail({ id }: { id: string }) {
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
        Cliente no encontrado
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
          Editar
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total facturado",
            value: formatCurrency(totalBilled),
            highlight: false,
          },
          {
            label: "Pendiente de cobro",
            value: formatCurrency(pendingBalance),
            highlight: pendingBalance > 0,
          },
          {
            label: "Facturas totales",
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
            Facturas
          </TabsTrigger>
          <TabsTrigger value="deals">
            <Briefcase className="h-4 w-4 mr-2" />
            Deals
          </TabsTrigger>
          <TabsTrigger value="datos">
            <Info className="h-4 w-4 mr-2" />
            Datos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facturas">
          <Card>
            <CardContent className="p-0">
              {!client.invoices || client.invoices.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Sin facturas todavía
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Número
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                        Fecha
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                        Importe
                      </th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.invoices.map((inv: any) => {
                      const sc = STATUS_CONFIG[inv.status] ?? { label: "Borrador", variant: "secondary" as const };
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
                            <Badge variant={sc.variant as any}>
                              {sc.label}
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
                <p className="text-sm text-muted-foreground">Sin deals asociados</p>
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
                  { label: "Razón social", value: client.legalName },
                  { label: "CIF/NIF", value: client.cifNif },
                  { label: "Email", value: client.email },
                  { label: "Teléfono", value: client.phone },
                  { label: "Móvil", value: client.mobile },
                  { label: "Web", value: client.website },
                  { label: "Dirección", value: client.address },
                  {
                    label: "Ciudad",
                    value: client.city
                      ? `${client.city}${client.province ? `, ${client.province}` : ""}`
                      : null,
                  },
                  { label: "Código postal", value: client.postalCode },
                  { label: "País", value: client.country },
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
                    Notas internas
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
