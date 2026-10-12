"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleLink } from "@/components/ui/locale-link";
import { Fuel } from "lucide-react";
import { useExpenseClaims } from "@/hooks/use-expense-claims";
import { useExpenseFormat } from "./use-expense-format";

export function VehicleExpensesCard({ vehicleId }: { vehicleId: string }) {
  const tf = useTranslations("fleet.expensesCard");
  const { t, money, date } = useExpenseFormat();
  const { data: claims = [], isLoading } = useExpenseClaims({ vehicleId, status: "APPROVED,REIMBURSED" });

  const total = claims.reduce((s, c) => s + Number(c.amount), 0);
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const thisYear = claims.filter((c) => c.date.slice(0, 10) >= yearStart).reduce((s, c) => s + Number(c.amount), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            {tf("title")}
          </CardTitle>
          {claims.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {tf("summary", { year: money(thisYear), total: money(total) })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? null : claims.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">
            {tf.rich("empty", {
              link: (chunks) => <LocaleLink href="/gastos" className="text-primary hover:underline">{chunks}</LocaleLink>,
            })}
          </p>
        ) : (
          <ul className="divide-y">
            {claims.slice(0, 8).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-6 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{t(`categories.${c.category}`)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {date(c.date)}
                    {c.merchant ? ` · ${c.merchant}` : ""}
                    {c.employee ? ` · ${c.employee.firstName} ${c.employee.lastName}` : ""}
                  </p>
                </div>
                <span className="tabular-nums font-medium shrink-0">{money(c.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
