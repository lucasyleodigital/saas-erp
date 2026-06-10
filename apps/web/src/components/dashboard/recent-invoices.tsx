"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const invoices = [
  { id: "F-2024-001", client: "Acme Corp SL", amount: 3450, status: "PAID", date: "2024-12-01" },
  { id: "F-2024-002", client: "Tech Solutions SA", amount: 1820, status: "SENT", date: "2024-12-03" },
  { id: "F-2024-003", client: "Moda Barcelona SL", amount: 5200, status: "OVERDUE", date: "2024-11-25" },
  { id: "F-2024-004", client: "Restaurante Can Pep", amount: 890, status: "DRAFT", date: "2024-12-08" },
  { id: "F-2024-005", client: "Consultoria Manel", amount: 2100, status: "PAID", date: "2024-12-10" },
];

const statusConfig: Record<string, { label: string; variant: "success" | "info" | "destructive" | "secondary" }> = {
  PAID: { label: "Pagada", variant: "success" },
  SENT: { label: "Enviada", variant: "info" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
  DRAFT: { label: "Borrador", variant: "secondary" },
};

export function RecentInvoices() {
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
        <div className="space-y-3">
          {invoices.map((inv) => {
            const config = statusConfig[inv.status];
            return (
              <div
                key={inv.id}
                className="flex items-center justify-between py-1 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.client}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.id} · {formatDate(inv.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className="text-sm font-semibold">{formatCurrency(inv.amount)}</span>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
