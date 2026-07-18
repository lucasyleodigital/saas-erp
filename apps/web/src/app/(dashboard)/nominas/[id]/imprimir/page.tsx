"use client";

import { use } from "react";
import { usePayroll, MONTHS_ES } from "@/hooks/use-payroll";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtN(n: number | string): string {
  return Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n: number | string): string {
  return `${Number(n).toFixed(2)} %`;
}
function periodDates(year: number, month: number): { from: string; to: string } {
  const lastDay = new Date(year, month, 0).getDate();
  const m = String(month).padStart(2, "0");
  return {
    from: `01.${m}.${year}`,
    to:   `${lastDay}.${m}.${year}`,
  };
}
function antigüedad(startDate?: string | null): string {
  if (!startDate) return "—";
  return new Date(startDate).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".");
}
function computeSS(grossSalary: number, ssEmployeeRate: number) {
  // Prorrata pagas extras (2 pagas / 12 meses)
  const prorrata = grossSalary * (2 / 12);
  const baseCotizacion = grossSalary + prorrata;

  // Desglose cotización empleado (suma total = ssEmployeeRate)
  const ccRate    = 4.70;  // contingencias comunes
  const atRate    = 1.55;  // accidentes trabajo / desempleo
  const fpRate    = 0.10;  // formación profesional
  const meiRate   = 0.12;  // mecanismo equidad intergeneracional

  const ccAmt   = baseCotizacion * ccRate  / 100;
  const atAmt   = baseCotizacion * atRate  / 100;
  const fpAmt   = baseCotizacion * fpRate  / 100;
  const meiAmt  = baseCotizacion * meiRate / 100;

  return { prorrata, baseCotizacion, ccRate, atRate, fpRate, meiRate, ccAmt, atAmt, fpAmt, meiAmt };
}

// ── Componentes ────────────────────────────────────────────────────────────────
function TdLabel({ children, cls = "" }: { children: React.ReactNode; cls?: string }) {
  return <td className={`py-[3px] px-2 ${cls}`}>{children}</td>;
}
function TdVal({ children, cls = "" }: { children: React.ReactNode; cls?: string }) {
  return <td className={`py-[3px] px-2 text-right font-mono ${cls}`}>{children}</td>;
}
function SepLine() {
  return <tr><td colSpan={5} className="border-t border-gray-400 py-0" /></tr>;
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function PrintPayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: p, isLoading } = usePayroll(id);

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;
  if (!p) return <div className="p-8 text-center">Nómina no encontrada.</div>;

  const emp     = p.employee!;
  const company = p.company!;
  const { from, to } = periodDates(p.year, p.month);
  const grossSalary = Number(p.grossSalary);
  const baseSalary  = Number(p.baseSalary);
  const bonuses     = Number(p.bonuses);
  const overtime    = Number(p.overtimePay);
  const ssEmployee  = Number(p.ssEmployee);
  const irpfRate    = Number(p.irpfRate);
  const irpfAmt     = Number(p.irpfAmount);
  const otherDed    = Number(p.otherDeductions ?? 0);
  const netSalary   = Number(p.netSalary);
  const ssEmployer  = Number(p.ssEmployer);
  const ssEmployeeRate = Number(p.ssEmployeeRate) * 100;

  const totalDeducciones = ssEmployee + irpfAmt + otherDed;
  const ss = computeSS(grossSalary, ssEmployeeRate);

  // Horas estándar mes
  const workingDays = 22;
  const totalHrs  = workingDays * (8);
  const realHrs   = totalHrs;

  return (
    <>
      <style>{`
        @page { size: A4; margin: 12mm 14mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: 'Courier New', Courier, monospace; }
      `}</style>

      {/* Barra de acción */}
      <div className="no-print p-4 bg-gray-100 border-b flex justify-between items-center">
        <span className="font-medium text-sm">Vista previa nómina — {from} al {to}</span>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir / Guardar PDF
        </Button>
      </div>

      {/* Documento A4 */}
      <div className="max-w-[780px] mx-auto p-8 bg-white text-black text-[11px] leading-tight font-mono">

        {/* ── BLOQUE EMPRESA + EMPLEADO ── */}
        <div className="flex justify-between mb-4">
          {/* Empresa */}
          <div className="space-y-[2px]">
            <p className="font-bold">{company.legalName ?? company.name}</p>
            {company.address && <p>{company.address}</p>}
            <p>N.I.S.S.: {(company as any).niss ?? "—"}</p>
            <p>NIF: {company.cif ?? "—"}</p>
            {company.city && <p>Población: {company.city}</p>}
          </div>
          {/* Empleado */}
          <div className="text-right space-y-[2px]">
            <p className="font-bold">{emp.lastName?.toUpperCase()}, {emp.firstName?.toUpperCase()}</p>
            <p>NAFS: {emp.socialSecurityNumber ?? "—"}</p>
            <p>DNI: {emp.nif ?? "—"}</p>
            <p>Antigüedad: {antigüedad((emp as any).startDate)}</p>
            <p>Categoría: {emp.position ?? "—"}</p>
          </div>
        </div>

        {/* Período */}
        <p className="mb-2">Periodo de liquidación: {from}-{to}</p>

        {/* ── TABLA CONCEPTOS ── */}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-t border-gray-600">
              <th className="text-left py-1 px-2 font-bold">Concepto</th>
              <th className="text-right py-1 px-2 font-bold">Unidades</th>
              <th className="text-right py-1 px-2 font-bold">Valor Base</th>
              <th className="text-right py-1 px-2 font-bold">Devengado</th>
              <th className="text-right py-1 px-2 font-bold">A Deducir</th>
            </tr>
          </thead>
          <tbody className="border-b border-gray-400">
            {/* Devengos */}
            <tr>
              <TdLabel>Sueldo base</TdLabel>
              <td /><td />
              <TdVal>{fmtN(baseSalary)}</TdVal>
              <td />
            </tr>
            {bonuses > 0 && (
              <tr>
                <TdLabel>Complementos / Antigüedad</TdLabel>
                <td /><td />
                <TdVal>{fmtN(bonuses)}</TdVal>
                <td />
              </tr>
            )}
            {overtime > 0 && (
              <tr>
                <TdLabel>Horas extraordinarias</TdLabel>
                <td /><td />
                <TdVal>{fmtN(overtime)}</TdVal>
                <td />
              </tr>
            )}

            {/* SS empleado */}
            <tr>
              <TdLabel>Acum.TR.cotiz.Seg.Soc.</TdLabel>
              <td /><td />
              <td />
              <TdVal>{fmtN(ssEmployee)}</TdVal>
            </tr>

            {/* Separador + base imponible */}
            <SepLine />
            <tr>
              <TdLabel>Base imponible</TdLabel>
              <td />
              <TdVal>{fmtN(grossSalary)}</TdVal>
              <td /><td />
            </tr>
            <tr>
              <TdLabel>% retención IRPF</TdLabel>
              <td />
              <TdVal>{fmtN(irpfRate)} %</TdVal>
              <td /><td />
            </tr>
            <tr>
              <TdLabel>Retención a cta. IRPF</TdLabel>
              <td /><td />
              <td />
              <TdVal>{fmtN(irpfAmt)}</TdVal>
            </tr>
            {otherDed > 0 && (
              <tr>
                <TdLabel>Otras deducciones</TdLabel>
                <td /><td />
                <td />
                <TdVal>{fmtN(otherDed)}</TdVal>
              </tr>
            )}
          </tbody>
        </table>

        {/* ── TOTALES ── */}
        <div className="flex justify-end mt-3 mb-1">
          <table className="text-[11px] border border-gray-400">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="px-6 py-1 text-center font-bold">T. Deveng.</th>
                <th className="px-6 py-1 text-center font-bold border-l border-gray-400">T. Deducc.</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-400">
                <TdVal cls="text-center">{fmtN(grossSalary)}</TdVal>
                <TdVal cls="text-center border-l border-gray-400">{fmtN(totalDeducciones)}</TdVal>
              </tr>
              <tr>
                <td colSpan={2} className="px-4 py-1 text-center">
                  Líquido&nbsp;&nbsp;<span className="font-bold text-[13px]">{fmtN(netSalary)}</span>&nbsp;EUR
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── CUADRO COTIZACIONES SS ── */}
        <div className="mt-4 border-t border-gray-600 pt-2">
          <div className="flex gap-8">
            {/* Columna izq: composición base */}
            <div className="space-y-[3px] min-w-[200px]">
              <p>Remuneración T.&nbsp;&nbsp;<span className="font-mono">{fmtN(grossSalary)}</span></p>
              <p>Prorrata Pagas&nbsp;&nbsp;&nbsp;<span className="font-mono">{fmtN(ss.prorrata)}</span></p>
              <p className="border-t border-gray-400 pt-1 font-bold">Total&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-mono">{fmtN(ss.baseCotizacion)}</span></p>
            </div>
            {/* Columna dcha: desglose cotizaciones */}
            <div className="flex-1">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="text-left py-1 px-1 font-bold">Concepto</th>
                    <th className="text-right py-1 px-1 font-bold">Importe</th>
                    <th className="text-right py-1 px-1 font-bold">%</th>
                    <th className="text-right py-1 px-1 font-bold">EUR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-1 py-[2px]">Base C.C.</td>
                    <TdVal>{fmtN(ss.baseCotizacion)}</TdVal>
                    <TdVal>{ss.ccRate.toFixed(2)}</TdVal>
                    <TdVal>{fmtN(ss.ccAmt)}</TdVal>
                  </tr>
                  <tr>
                    <td className="px-1 py-[2px]">Desempleo / AT</td>
                    <TdVal>{fmtN(ss.baseCotizacion)}</TdVal>
                    <TdVal>{ss.atRate.toFixed(2)}</TdVal>
                    <TdVal>{fmtN(ss.atAmt)}</TdVal>
                  </tr>
                  <tr>
                    <td className="px-1 py-[2px]">B.Hrs.Extr</td>
                    <TdVal>0,00</TdVal>
                    <TdVal>4,85</TdVal>
                    <TdVal>0,00</TdVal>
                  </tr>
                  <tr>
                    <td className="px-1 py-[2px]">MEI + FP</td>
                    <TdVal>{fmtN(ss.baseCotizacion)}</TdVal>
                    <TdVal>{(ss.meiRate + ss.fpRate).toFixed(2)}</TdVal>
                    <TdVal>{fmtN(ss.meiAmt + ss.fpAmt)}</TdVal>
                  </tr>
                  <tr className="border-t border-gray-400 font-bold">
                    <td className="px-1 py-[2px]" colSpan={3}>Total aportación mensual empresa a SS</td>
                    <TdVal>{fmtN(ssEmployer)}</TdVal>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RESUMEN HORAS ── */}
        <div className="mt-3 border-t border-gray-400 pt-2 text-[10px]">
          <p className="font-bold mb-1">Resumen horas realizadas en el periodo de nómina</p>
          <p>Total Hrs Mes: {totalHrs},00&nbsp;&nbsp;&nbsp;Hrs. Abs. Mes: 0,00&nbsp;&nbsp;&nbsp;Hrs. Reales Mes: {realHrs},00</p>
        </div>

        {/* ── PAGO + FIRMA ── */}
        <div className="mt-3 border-t border-gray-400 pt-2 grid grid-cols-2 gap-8">
          <div className="space-y-[3px]">
            <p>Forma de cobro: Transferencia</p>
            {emp.bankAccount && (
              <p>Entidad: <span className="font-mono">{emp.bankAccount}</span></p>
            )}
            {emp.bankHolder && <p className="text-[10px] text-gray-600">{emp.bankHolder}</p>}
          </div>
          <div className="text-right">
            <p>{company.city ?? "—"}, {to}</p>
            <div className="mt-8 border-t border-gray-400 pt-2 text-[10px] text-gray-500">
              Firma del trabajador / Recibí
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
