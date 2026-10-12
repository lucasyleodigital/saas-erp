"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseClaim, PolicyWarning } from "@/hooks/use-expense-claims";

export function useExpenseFormat() {
  const t = useTranslations("expenses");
  const locale = useLocale();

  const money = (v: number | string) => formatCurrency(Number(v), "EUR", locale);
  const date = (v: string | Date) => formatDate(v, locale);
  const monthYear = (month: number, year: number) =>
    new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });

  function claimDetail(c: ExpenseClaim) {
    if (c.category === "MILEAGE") {
      const route = [c.origin, c.destination].filter(Boolean).join(" → ");
      return `${route ? route + " · " : ""}${t("report.mileageDetail", { km: Number(c.distanceKm) })}`;
    }
    if (c.category === "PER_DIEM" && c.perDiemType) {
      return t("report.perDiemDetail", { type: t(`perDiem.${c.perDiemType}`), days: Number(c.perDiemDays) });
    }
    return c.merchant || c.description || "—";
  }

  function warningText(w: PolicyWarning) {
    const p = w.params ?? {};
    switch (w.code) {
      case "OVER_LIMIT":
        return p.max !== undefined ? t("warningText.OVER_LIMIT", { max: money(p.max) }) : w.message;
      case "TOO_OLD":
        return p.days !== undefined ? t("warningText.TOO_OLD", { days: p.days }) : w.message;
      case "TAXABLE_EXCESS":
        return p.amount !== undefined
          ? t(p.kind === "mileage" ? "warningText.TAXABLE_EXCESS_mileage" : "warningText.TAXABLE_EXCESS_perDiem", { amount: money(p.amount) })
          : w.message;
      case "MEALS_DAILY_LIMIT":
        return p.total !== undefined ? t("warningText.MEALS_DAILY_LIMIT", { total: money(p.total), limit: money(p.limit ?? 0) }) : w.message;
      default:
        return t.has(`warningText.${w.code}`) ? t(`warningText.${w.code}`) : w.message;
    }
  }

  return { t, locale, money, date, monthYear, claimDetail, warningText };
}
