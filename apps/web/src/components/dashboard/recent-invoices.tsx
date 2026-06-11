"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRecentInvoices } from "@/hooks/use-dashboard";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "success" | "info" | "destructive" | "secondary" | "warning";
  }
> = {
  PAID: { label: "Pagada", variant: "success" },
  SENT: { label: "Enviada", variant: "info" },
  PARTIAL: { label: "Parcial", variant: "warning" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
  DRAFT: { label: "Borrador", variant: "secondary" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
};

export function RecentInvoices() {
  const { data: invoices, isLoading } = useRecentInvoices();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Facturas recientes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/facturas" className="text-xs gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay facturas todavía
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv: any) => {
              const config =
                STATUS_CONFIG[inv.status] ?? { label: "Borrador", variant: "secondary" as const };
              return (
                <Link
                  key={inv.id}
                  href={`/facturas/${inv.id}`}
                  className="flex items-center justify-between py-1 border-b border-border last:border-0 hover:bg-muted/20 rounded-sm px-1 -mx-1 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {inv.client?.name ?? "Sin cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{inv.number}</span> ·{" "}
                      {formatDate(inv.issueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-sm font-semibold">
                      {formatCurrency(Number(inv.total))}
                    </span>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
