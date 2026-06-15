"use client";

import { use } from "react";
import { usePayroll, MONTHS_ES } from "@/hooks/use-payroll";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

function fmt(n: number | string) {
  return Number(n).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default function PrintPayslipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: p, isLoading } = usePayroll(id);

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;
  if (!p) return <div className="p-8 text-center">Nómina no encontrada.</div>;

  const emp = p.employee!;
  const company = p.company!;
  const periodLabel = `${MONTHS_ES[p.month]} ${p.year}`;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="no-print p-4 bg-gray-100 flex justify-between items-center">
        <span className="font-medium">Vista previa de nómina — {periodLabel}</span>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir / Guardar PDF
        </Button>
      </div>

      <div className="max-w-[800px] mx-auto p-8 bg-white text-black font-sans text-sm">
        {/* Cabecera */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold">{company.legalName ?? company.name}</h1>
            {company.cif && <p className="text-xs text-gray-600">CIF: {company.cif}</p>}
            {company.address && <p className="text-xs text-gray-600">{company.address}{company.city ? `, ${company.city}` : ""}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-700">NÓMINA</h2>
            <p className="text-sm font-medium">{periodLabel}</p>
          </div>
        </div>

        {/* Trabajador */}
        <div className="grid grid-cols-3 gap-4 border border-gray-300 rounded p-3 mb-4 bg-gray-50">
          <div><span className="text-xs text-gray-500 block">Trabajador</span><span className="font-semibold">{emp.firstName} {emp.lastName}</span></div>
          <div><span className="text-xs text-gray-500 block">NIF</span><span>{emp.nif ?? "—"}</span></div>
          <div><span className="text-xs text-gray-500 block">Nº Seg. Social</span><span>{emp.socialSecurityNumber ?? "—"}</span></div>
          <div><span className="text-xs text-gray-500 block">Categoría / Puesto</span><span>{emp.position ?? "—"}</span></div>
          <div><span className="text-xs text-gray-500 block">Tipo contrato</span><span>{emp.contractType ?? "—"}</span></div>
          <div><span className="text-xs text-gray-500 block">Periodo</span><span>{periodLabel}</span></div>
        </div>

        {/* Devengos */}
        <table className="w-full mb-1 text-sm">
          <thead>
            <tr className="bg-gray-200"><th className="text-left px-3 py-2 font-semibold" colSpan={2}>I. DEVENGOS</th></tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100"><td className="px-3 py-1">Salario base</td><td className="px-3 py-1 text-right font-mono">{fmt(p.baseSalary)}</td></tr>
            {Number(p.overtimePay) > 0 && <tr className="border-b border-gray-100"><td className="px-3 py-1">Horas extraordinarias</td><td className="px-3 py-1 text-right font-mono">{fmt(p.overtimePay)}</td></tr>}
            {Number(p.bonuses) > 0 && <tr className="border-b border-gray-100"><td className="px-3 py-1">Complementos / Pagas extraordinarias</td><td className="px-3 py-1 text-right font-mono">{fmt(p.bonuses)}</td></tr>}
            <tr className="bg-gray-50 font-semibold"><td className="px-3 py-2">TOTAL DEVENGADO</td><td className="px-3 py-2 text-right font-mono">{fmt(p.grossSalary)}</td></tr>
          </tbody>
        </table>

        {/* Deducciones */}
        <table className="w-full mb-1 text-sm">
          <thead>
            <tr className="bg-gray-200"><th className="text-left px-3 py-2 font-semibold" colSpan={3}>II. DEDUCCIONES</th></tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-3 py-1">Cotizaciones Seg. Social (contingencias comunes + desempleo + FP)</td>
              <td className="px-3 py-1 text-center text-gray-500">{(Number(p.ssEmployeeRate) * 100).toFixed(2)}%</td>
              <td className="px-3 py-1 text-right font-mono">{fmt(p.ssEmployee)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-3 py-1">I.R.P.F.</td>
              <td className="px-3 py-1 text-center text-gray-500">{Number(p.irpfRate).toFixed(2)}%</td>
              <td className="px-3 py-1 text-right font-mono">{fmt(p.irpfAmount)}</td>
            </tr>
            {Number(p.otherDeductions) > 0 && (
              <tr className="border-b border-gray-100">
                <td className="px-3 py-1">Otras deducciones</td>
                <td />
                <td className="px-3 py-1 text-right font-mono">{fmt(p.otherDeductions)}</td>
              </tr>
            )}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-3 py-2" colSpan={2}>TOTAL DEDUCCIONES</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(Number(p.ssEmployee) + Number(p.irpfAmount) + Number(p.otherDeductions))}</td>
            </tr>
          </tbody>
        </table>

        {/* Líquido */}
        <div className="border-2 border-gray-800 rounded p-3 mb-4 flex justify-between items-center">
          <span className="text-lg font-bold">LÍQUIDO A PERCIBIR</span>
          <span className="text-2xl font-bold">{fmt(p.netSalary)}</span>
        </div>

        {/* Banco + Firma */}
        <div className="grid grid-cols-2 gap-8 mt-6">
          <div>
            {emp.bankAccount && (
              <div className="border-b border-gray-300 pb-2">
                <span className="text-xs text-gray-500 block mb-1">Número de cuenta (IBAN)</span>
                <span className="font-mono">{emp.bankAccount}</span>
                {emp.bankHolder && <span className="block text-xs text-gray-500">{emp.bankHolder}</span>}
              </div>
            )}
            <div className="mt-4 pt-12 border-t border-gray-300">
              <p className="text-xs text-gray-500 text-center">Firma del trabajador / Recibí</p>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Cotización empresa</div>
            <table className="w-full text-xs">
              <tbody>
                <tr><td>Salario bruto</td><td className="text-right font-mono">{fmt(p.grossSalary)}</td></tr>
                <tr><td>SS empresa ({(Number(p.ssEmployerRate) * 100).toFixed(2)}%)</td><td className="text-right font-mono">{fmt(p.ssEmployer)}</td></tr>
                <tr className="font-semibold border-t border-gray-300"><td>Coste total empresa</td><td className="text-right font-mono">{fmt(p.totalCost)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
