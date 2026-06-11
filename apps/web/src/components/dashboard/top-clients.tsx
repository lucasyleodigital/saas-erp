"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getInitials } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTopClients } from "@/hooks/use-dashboard";

export function TopClients() {
  const { data: clients, isLoading } = useTopClients();

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
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : !clients || clients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay clientes todavía
          </p>
        ) : (
          <div className="space-y-3">
            {clients.map((client: any) => (
              <Link
                key={client.id}
                href={`/clientes/${client.id}`}
                className="flex items-center gap-3 py-1 border-b border-border last:border-0 hover:bg-muted/20 rounded-sm px-1 -mx-1 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                  {getInitials(client.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client._count?.invoices ?? 0} facturas
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">
                    {formatCurrency(Number(client.totalBilled ?? 0))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
