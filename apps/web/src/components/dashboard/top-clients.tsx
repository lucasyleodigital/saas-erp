"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getInitials } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const clients = [
  { name: "Acme Corp SL", invoices: 12, total: 48200, change: 8.2 },
  { name: "Tech Solutions SA", invoices: 8, total: 32100, change: 15.4 },
  { name: "Moda Barcelona SL", invoices: 6, total: 21800, change: -3.1 },
  { name: "Consultoria Manel", invoices: 9, total: 18500, change: 22.0 },
  { name: "Restaurante Can Pep", invoices: 4, total: 9800, change: 5.7 },
];

export function TopClients() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Top clientes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clientes" className="text-xs gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clients.map((client, i) => (
            <div
              key={client.name}
              className="flex items-center gap-3 py-1 border-b border-border last:border-0"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                {getInitials(client.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground">
                  {client.invoices} facturas
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(client.total)}</p>
                <p
                  className={`text-xs ${
                    client.change > 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {client.change > 0 ? "+" : ""}
                  {client.change}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
