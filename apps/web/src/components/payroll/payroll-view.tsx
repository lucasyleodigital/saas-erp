"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  usePayrolls, usePayrollStats, useGeneratePayrolls,
  useApprovePayroll, useMarkPayrollPaid, useDeletePayroll,
  getPayrollStatusConfig, MONTHS_ES, type Payroll,
} from "@/hooks/use-payroll";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Wand2, Download, CheckCircle, CreditCard, Trash2, Eye,
  Users, TrendingUp, Euro, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: MONTHS_ES[i + 1] }));

function fmt(n: number | string) {
  return Number(n).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function PayrollView() {
  const t = useTranslations("payroll");
  const locale = useLocale();
  const router = useRouter();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const { data: payrolls = [], isLoading } = usePayrolls(year, month);
  const { data: stats } = usePayrollStats(year, month);
  const generateMut = useGeneratePayrolls();
  const approveMut = useApprovePayroll();
  const paidMut = useMarkPayrollPaid();
  const deleteMut = useDeletePayroll();

  const handleGenerate = async () => {
    try {
      const created = await generateMut.mutateAsync({ year, month });
      toast.success(`${created.length} nóminas generadas`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al generar nóminas";
      toast.error(msg);
    }
  };

  const handleApproveAll = async () => {
    const drafts = payrolls.filter(p => p.status === "DRAFT");
    await Promise.all(drafts.map(p => approveMut.mutateAsync(p.id)));
    toast.success(`${drafts.length} nóminas aprobadas`);
  };

  const handlePayAll = async () => {
    const approved = payrolls.filter(p => p.status === "APPROVED");
    await Promise.all(approved.map(p => paidMut.mutateAsync({ id: p.id })));
    toast.success(`${approved.length} nóminas marcadas como pagadas`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar esta nómina? Esta acción no se puede deshacer.")) return;
    deleteMut.mutate(id, { onSuccess: () => toast.success("Nómina eliminada") });
  };

  const handleSepa = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const url = `${apiUrl}/payrolls/sepa?year=${year}&month=${month}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `sepa-nominas-${year}-${String(month).padStart(2, "0")}.xml`;
        a.click();
      })
      .catch(() => toast.error("Error al generar SEPA XML"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSepa} disabled={!payrolls.some(p => p.status === "APPROVED")}>
            <Download className="h-4 w-4 mr-1" /> SEPA XML
          </Button>
          <Button onClick={handleGenerate} disabled={generateMut.isPending}>
            <Wand2 className="h-4 w-4 mr-1" />
            {generateMut.isPending ? "Generando..." : t("new")}
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="h-5 w-5 text-blue-600" />} label={t("employees")} value={String(stats.total)} sub={`${stats.paid} pagadas`} />
          <StatCard icon={<Euro className="h-5 w-5 text-green-600" />} label={t("netTotal")} value={fmt(stats.totalNet)} sub="líquido a pagar" />
          <StatCard icon={<TrendingUp className="h-5 w-5 text-orange-600" />} label={t("companyCost")} value={fmt(stats.totalCost)} sub={`SS: ${fmt(stats.totalSS)}`} />
          <StatCard icon={<Receipt className="h-5 w-5 text-purple-600" />} label={t("irpfWithheld")} value={fmt(stats.totalIRPF)} sub="a ingresar en AEAT" />
        </div>
      )}

      {/* Batch actions */}
      {payrolls.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {payrolls.some(p => p.status === "DRAFT") && (
            <Button variant="outline" size="sm" onClick={handleApproveAll} disabled={approveMut.isPending}>
              <CheckCircle className="h-4 w-4 mr-1" /> Aprobar todas
            </Button>
          )}
          {payrolls.some(p => p.status === "APPROVED") && (
            <Button variant="outline" size="sm" onClick={handlePayAll} disabled={paidMut.isPending}>
              <CreditCard className="h-4 w-4 mr-1" /> Marcar pagadas
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
      ) : payrolls.length === 0 ? (
        <div className="text-center py-16 border rounded-xl">
          <p className="text-muted-foreground mb-4">No hay nóminas para {MONTHS_ES[month]} {year}</p>
          <Button onClick={handleGenerate} disabled={generateMut.isPending}>
            <Wand2 className="h-4 w-4 mr-1" /> Generar nóminas del período
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Empleado</th>
                <th className="text-right px-4 py-3 font-medium">Bruto</th>
                <th className="text-right px-4 py-3 font-medium">SS empleado</th>
                <th className="text-right px-4 py-3 font-medium">IRPF</th>
                <th className="text-right px-4 py-3 font-medium">Neto</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payrolls.map(p => {
                const cfg = getPayrollStatusConfig(p.status);
                const emp = p.employee;
                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{emp?.firstName} {emp?.lastName}</div>
                      <div className="text-xs text-muted-foreground">{emp?.position ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(p.grossSalary)}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">-{fmt(p.ssEmployee)}</td>
                    <td className="px-4 py-3 text-right font-mono text-orange-600">-{fmt(p.irpfAmount)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-green-700">{fmt(p.netSalary)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" title="Ver nómina"
                          onClick={() => router.push(`/${locale}/nominas/${p.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {p.status === "DRAFT" && (
                          <Button
                            variant="ghost" size="icon" title="Aprobar"
                            onClick={() => approveMut.mutate(p.id)}
                          >
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {p.status === "APPROVED" && (
                          <Button
                            variant="ghost" size="icon" title="Marcar pagada"
                            onClick={() => paidMut.mutate({ id: p.id })}
                          >
                            <CreditCard className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {p.status !== "PAID" && (
                          <Button
                            variant="ghost" size="icon" title="Eliminar"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="border rounded-xl p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon}{label}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
