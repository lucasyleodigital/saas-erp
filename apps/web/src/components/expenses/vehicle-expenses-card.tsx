"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleLink } from "@/components/ui/locale-link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Fuel } from "lucide-react";
import { CATEGORY_LABELS, useExpenseClaims } from "@/hooks/use-expense-claims";

export function VehicleExpensesCard({ vehicleId }: { vehicleId: string }) {
  const { data: claims = [], isLoading } = useExpenseClaims({ vehicleId, status: "APPROVED,REIMBURSED" });

  const total = claims.reduce((s, c) => s + Number(c.amount), 0);
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const thisYear = claims.filter((c) => c.date.slice(0, 10) >= yearStart).reduce((s, c) => s + Number(c.amount), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            Combustible, peajes y gastos
          </CardTitle>
          {claims.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Este año {formatCurrency(thisYear)} · Total {formatCurrency(total)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? null : claims.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">
            Sin gastos aprobados. Al registrar un gasto en{" "}
            <LocaleLink href="/gastos" className="text-primary hover:underline">Gastos y dietas</LocaleLink>, asocia el vehículo para verlo aquí.
          </p>
        ) : (
          <ul className="divide-y">
            {claims.slice(0, 8).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-6 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{CATEGORY_LABELS[c.category]}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatDate(c.date)}
                    {c.merchant ? ` · ${c.merchant}` : ""}
                    {c.employee ? ` · ${c.employee.firstName} ${c.employee.lastName}` : ""}
                  </p>
                </div>
                <span className="tabular-nums font-medium shrink-0">{formatCurrency(Number(c.amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
