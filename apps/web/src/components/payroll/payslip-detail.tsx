"use client";

import { usePayroll, getPayrollStatusConfig, MONTHS_ES } from "@/hooks/use-payroll";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

function fmt(n: number | string) {
  return Number(n).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}
function fmtPct(n: number | string) {
  return `${Number(n).toFixed(2)} %`;
}

interface Props { id: string }

export function PayslipDetail({ id }: Props) {
  const locale = useLocale();
  const t = useTranslations("payroll");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: payroll, isLoading } = usePayroll(id);

  if (isLoading) return <div className="text-center py-16 text-muted-foreground">{t("payslip.loading")}</div>;
  if (!payroll) return <div className="text-center py-16 text-muted-foreground">{t("payslip.notFound")}</div>;

  const emp = payroll.employee!;
  const company = payroll.company!;
  const cfg = getPayrollStatusConfig(payroll.status);
  const periodLabel = `${MONTHS_ES[payroll.month]} ${payroll.year}`;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push(`/${locale}/nominas`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("payslip.backToPayrolls")}
        </Button>
        <div className="flex gap-2">
          <Badge className={cfg.color}>{cfg.label}</Badge>
          <Button variant="outline" onClick={() => router.push(`/${locale}/nominas/${id}/imprimir`)}>
            <Printer className="h-4 w-4 mr-2" /> {t("payslip.printPdf")}
          </Button>
        </div>
      </div>

      {/* Card nómina */}
      <div className="border rounded-xl overflow-hidden" id="payslip-card">
        {/* Cabecera empresa */}
        <div className="bg-primary/5 border-b px-6 py-4 flex justify-between items-start">
          <div>
            <h2 className="font-bold text-lg">{company.legalName ?? company.name}</h2>
            {company.cif && <p className="text-sm text-muted-foreground">{t("payslip.cif")}: {company.cif}</p>}
            {company.address && <p className="text-sm text-muted-foreground">{company.address}{company.city ? `, ${company.city}` : ""}</p>}
          </div>
          <div className="text-right">
            <p className="font-semibold text-primary">{t("payslip.payslipLabel")}</p>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>
        </div>

        {/* Datos empleado */}
        <div className="px-6 py-4 border-b grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/20">
          <DataItem label={t("table.employee")} value={`${emp.firstName} ${emp.lastName}`} />
          <DataItem label={t("payslip.nif")} value={emp.nif ?? "—"} />
          <DataItem label={t("payslip.ssNumber")} value={emp.socialSecurityNumber ?? "—"} />
          <DataItem label={t("payslip.position")} value={emp.position ?? "—"} />
          <DataItem label={t("payslip.department")} value={emp.department ?? "—"} />
          <DataItem label={t("payslip.contract")} value={emp.contractType ?? "—"} />
        </div>

        {/* Devengos */}
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">{t("payslip.earnings")}</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border/50">
              <Row label={t("payslip.baseSalary")} value={fmt(payroll.baseSalary)} />
              {Number(payroll.overtimePay) > 0 && <Row label={t("payslip.overtimePay")} value={fmt(payroll.overtimePay)} />}
              {Number(payroll.bonuses) > 0 && <Row label={t("payslip.bonuses")} value={fmt(payroll.bonuses)} />}
              <Row label={t("payslip.totalEarnings")} value={fmt(payroll.grossSalary)} bold />
            </tbody>
          </table>
        </div>

        {/* Deducciones */}
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">{t("payslip.deductions")}</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border/50">
              <Row
                label={t("payslip.ssEmployee", { rate: fmtPct(Number(payroll.ssEmployeeRate) * 100) })}
                value={`-${fmt(payroll.ssEmployee)}`}
                red
              />
              <Row
                label={t("payslip.irpfWithholding", { rate: fmtPct(payroll.irpfRate) })}
                value={`-${fmt(payroll.irpfAmount)}`}
                red
              />
              {Number(payroll.otherDeductions) > 0 && (
                <Row label={t("payslip.otherDeductions")} value={`-${fmt(payroll.otherDeductions)}`} red />
              )}
              <Row
                label={t("payslip.totalDeductions")}
                value={`-${fmt(Number(payroll.ssEmployee) + Number(payroll.irpfAmount) + Number(payroll.otherDeductions))}`}
                bold red
              />
            </tbody>
          </table>
        </div>

        {/* Líquido */}
        <div className="px-6 py-5 bg-green-50 dark:bg-green-950/20">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">{t("payslip.netPay")}</span>
            <span className="text-2xl font-bold text-green-700 dark:text-green-400">{fmt(payroll.netSalary)}</span>
          </div>
          {payroll.employee?.bankAccount && (
            <p className="text-xs text-muted-foreground mt-1">
              IBAN: {payroll.employee.bankAccount} · {payroll.employee.bankHolder ?? ""}
            </p>
          )}
        </div>

        {/* Coste empresa */}
        <div className="px-6 py-4 border-t bg-muted/20">
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">{t("payslip.companyCost")}</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border/50">
              <Row label={t("payslip.grossSalary")} value={fmt(payroll.grossSalary)} />
              <Row
                label={t("payslip.ssEmployer", { rate: fmtPct(Number(payroll.ssEmployerRate) * 100) })}
                value={`+${fmt(payroll.ssEmployer)}`}
              />
              <Row label={t("payslip.totalCompanyCost")} value={fmt(payroll.totalCost)} bold />
            </tbody>
          </table>
        </div>

        {payroll.notes && (
          <div className="px-6 py-3 border-t text-sm text-muted-foreground">
            <span className="font-medium">{tCommon("notes")}: </span>{payroll.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

function Row({ label, value, bold, red }: { label: string; value: string; bold?: boolean; red?: boolean }) {
  return (
    <tr>
      <td className={`py-2 ${bold ? "font-semibold" : ""}`}>{label}</td>
      <td className={`py-2 text-right font-mono ${bold ? "font-semibold" : ""} ${red ? "text-red-600" : ""}`}>{value}</td>
    </tr>
  );
}
