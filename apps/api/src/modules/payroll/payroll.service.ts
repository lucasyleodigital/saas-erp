import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

// Spain 2024 IRPF brackets (state + avg autonomous community)
const IRPF_BRACKETS = [
  { limit: 12450,    rate: 0.19 },
  { limit: 20200,    rate: 0.24 },
  { limit: 35200,    rate: 0.30 },
  { limit: 60000,    rate: 0.37 },
  { limit: 300000,   rate: 0.45 },
  { limit: Infinity, rate: 0.47 },
];
const PERSONAL_MINIMUM = 5550;  // mínimo personal 2024
const SS_EMPLOYEE_RATE = 0.0647; // 6.47%
const SS_EMPLOYER_RATE = 0.3048; // 30.48%
const MIN_IRPF_RATE = 2;         // retención mínima 2%

function calculateIRPFRate(annualGross: number): number {
  const annualSS = annualGross * SS_EMPLOYEE_RATE;
  const taxableBase = Math.max(0, annualGross - annualSS - PERSONAL_MINIMUM);
  if (taxableBase <= 0) return MIN_IRPF_RATE;

  let tax = 0;
  let prev = 0;
  for (const bracket of IRPF_BRACKETS) {
    if (taxableBase <= prev) break;
    const inBracket = Math.min(taxableBase - prev, bracket.limit - prev);
    tax += inBracket * bracket.rate;
    prev = bracket.limit;
  }
  const effectiveRate = (tax / annualGross) * 100;
  return Math.max(MIN_IRPF_RATE, Math.round(effectiveRate * 100) / 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  private computePayroll(monthlySalary: number, overrides?: {
    overtimePay?: number;
    bonuses?: number;
    otherDeductions?: number;
    irpfRate?: number;
  }) {
    const baseSalary = round2(monthlySalary);
    const overtimePay = round2(overrides?.overtimePay ?? 0);
    const bonuses = round2(overrides?.bonuses ?? 0);
    const grossSalary = round2(baseSalary + overtimePay + bonuses);

    const annualGross = grossSalary * 12;
    const irpfRate = overrides?.irpfRate !== undefined
      ? overrides.irpfRate
      : round2(calculateIRPFRate(annualGross));

    const ssEmployee = round2(grossSalary * SS_EMPLOYEE_RATE);
    const ssEmployer = round2(grossSalary * SS_EMPLOYER_RATE);
    const irpfAmount = round2(grossSalary * (irpfRate / 100));
    const otherDeductions = round2(overrides?.otherDeductions ?? 0);
    const netSalary = round2(grossSalary - ssEmployee - irpfAmount - otherDeductions);
    const totalCost = round2(grossSalary + ssEmployer);

    return {
      baseSalary,
      overtimePay,
      bonuses,
      grossSalary,
      ssEmployeeRate: SS_EMPLOYEE_RATE,
      ssEmployerRate: SS_EMPLOYER_RATE,
      ssEmployee,
      ssEmployer,
      irpfRate,
      irpfAmount,
      otherDeductions,
      netSalary,
      totalCost,
    };
  }

  async findAll(companyId: string, year: number, month: number) {
    return this.prisma.payroll.findMany({
      where: { companyId, year, month },
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true,
            position: true, department: true, bankAccount: true, bankHolder: true,
            nif: true,
          },
        },
      },
      orderBy: [{ employee: { lastName: "asc" } }],
    });
  }

  async findOne(companyId: string, id: string) {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            nif: true, socialSecurityNumber: true, position: true, department: true,
            contractType: true, startDate: true, bankAccount: true, bankHolder: true,
          },
        },
        company: {
          select: { name: true, legalName: true, cif: true, address: true, city: true },
        },
      },
    });
    if (!payroll) throw new NotFoundException("Nómina no encontrada");
    return payroll;
  }

  async generateMonthlyPayrolls(companyId: string, year: number, month: number) {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, status: "ACTIVE" },
    });
    if (!employees.length) return [];

    const created: unknown[] = [];
    for (const emp of employees) {
      const exists = await this.prisma.payroll.findUnique({
        where: { companyId_employeeId_year_month: { companyId, employeeId: emp.id, year, month } },
      });
      if (exists) continue;

      const computed = this.computePayroll(Number(emp.salary));
      const payroll = await this.prisma.payroll.create({
        data: { companyId, employeeId: emp.id, year, month, ...computed, status: "DRAFT" },
      });
      created.push(payroll);
    }
    return created;
  }

  async update(companyId: string, id: string, dto: {
    overtimePay?: number;
    bonuses?: number;
    otherDeductions?: number;
    irpfRate?: number;
    notes?: string;
  }) {
    const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
    if (!payroll) throw new NotFoundException("Nómina no encontrada");
    if (payroll.status === "PAID") throw new ConflictException("La nómina ya está pagada");

    const computed = this.computePayroll(Number(payroll.baseSalary), {
      overtimePay: dto.overtimePay,
      bonuses: dto.bonuses,
      otherDeductions: dto.otherDeductions,
      irpfRate: dto.irpfRate,
    });
    return this.prisma.payroll.update({
      where: { id },
      data: { ...computed, notes: dto.notes, status: "DRAFT" },
    });
  }

  async approve(companyId: string, id: string) {
    const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
    if (!payroll) throw new NotFoundException("Nómina no encontrada");
    return this.prisma.payroll.update({ where: { id }, data: { status: "APPROVED" } });
  }

  async markPaid(companyId: string, id: string, paymentDate?: string) {
    const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
    if (!payroll) throw new NotFoundException("Nómina no encontrada");
    return this.prisma.payroll.update({
      where: { id },
      data: { status: "PAID", paymentDate: paymentDate ? new Date(paymentDate) : new Date() },
    });
  }

  async remove(companyId: string, id: string) {
    const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
    if (!payroll) throw new NotFoundException("Nómina no encontrada");
    if (payroll.status === "PAID") throw new ConflictException("No se puede eliminar una nómina pagada");
    return this.prisma.payroll.delete({ where: { id } });
  }

  async getStats(companyId: string, year: number, month: number) {
    const payrolls = await this.prisma.payroll.findMany({
      where: { companyId, year, month },
    });
    const total = payrolls.length;
    const draft = payrolls.filter(p => p.status === "DRAFT").length;
    const approved = payrolls.filter(p => p.status === "APPROVED").length;
    const paid = payrolls.filter(p => p.status === "PAID").length;
    const totalNet = payrolls.reduce((s, p) => s + Number(p.netSalary), 0);
    const totalGross = payrolls.reduce((s, p) => s + Number(p.grossSalary), 0);
    const totalCost = payrolls.reduce((s, p) => s + Number(p.totalCost), 0);
    const totalIRPF = payrolls.reduce((s, p) => s + Number(p.irpfAmount), 0);
    const totalSS = payrolls.reduce((s, p) => s + Number(p.ssEmployee) + Number(p.ssEmployer), 0);
    return { total, draft, approved, paid, totalNet, totalGross, totalCost, totalIRPF, totalSS };
  }

  async getModelo111(companyId: string, year: number, quarter: number) {
    // quarter: 1-4 → months 1-3, 4-6, 7-9, 10-12
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const payrolls = await this.prisma.payroll.findMany({
      where: { companyId, year, month: { gte: startMonth, lte: endMonth }, status: { in: ["APPROVED", "PAID"] } },
      include: { employee: { select: { firstName: true, lastName: true, nif: true } } },
    });
    const totalGross = payrolls.reduce((s, p) => s + Number(p.grossSalary), 0);
    const totalIRPF = payrolls.reduce((s, p) => s + Number(p.irpfAmount), 0);
    const employees = payrolls.reduce((acc, p) => {
      const key = p.employeeId;
      if (!acc[key]) acc[key] = { ...p.employee, grossSalary: 0, irpfAmount: 0 };
      acc[key].grossSalary += Number(p.grossSalary);
      acc[key].irpfAmount += Number(p.irpfAmount);
      return acc;
    }, {} as Record<string, { firstName: string; lastName: string; nif: string | null; grossSalary: number; irpfAmount: number }>);
    return {
      year, quarter, startMonth, endMonth,
      totalGross: round2(totalGross),
      totalIRPF: round2(totalIRPF),
      numPerceptores: Object.keys(employees).length,
      employees: Object.values(employees),
    };
  }

  async getModelo190(companyId: string, year: number) {
    const payrolls = await this.prisma.payroll.findMany({
      where: { companyId, year, status: { in: ["APPROVED", "PAID"] } },
      include: { employee: { select: { firstName: true, lastName: true, nif: true } } },
    });
    const byEmployee: Record<string, {
      firstName: string; lastName: string; nif: string | null;
      grossSalary: number; irpfAmount: number; ssEmployee: number;
    }> = {};
    for (const p of payrolls) {
      const key = p.employeeId;
      if (!byEmployee[key]) byEmployee[key] = { ...p.employee, grossSalary: 0, irpfAmount: 0, ssEmployee: 0 };
      byEmployee[key].grossSalary += Number(p.grossSalary);
      byEmployee[key].irpfAmount += Number(p.irpfAmount);
      byEmployee[key].ssEmployee += Number(p.ssEmployee);
    }
    const rows = Object.values(byEmployee).map(r => ({
      ...r,
      grossSalary: round2(r.grossSalary),
      irpfAmount: round2(r.irpfAmount),
      ssEmployee: round2(r.ssEmployee),
    }));
    return {
      year,
      totalGross: round2(rows.reduce((s, r) => s + r.grossSalary, 0)),
      totalIRPF: round2(rows.reduce((s, r) => s + r.irpfAmount, 0)),
      numPerceptores: rows.length,
      employees: rows,
    };
  }

  async generateSepaXml(companyId: string, year: number, month: number, paymentDate?: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, legalName: true },
    });
    const payrolls = await this.prisma.payroll.findMany({
      where: { companyId, year, month, status: "APPROVED" },
      include: {
        employee: { select: { firstName: true, lastName: true, bankAccount: true, bankHolder: true } },
      },
    });
    if (!payrolls.length) throw new ConflictException("No hay nóminas aprobadas para exportar");

    const companyName = company?.legalName ?? company?.name ?? "Empresa";
    const execDate = paymentDate ?? new Date().toISOString().split("T")[0];
    const msgId = `NOMINA-${year}-${String(month).padStart(2, "0")}-${Date.now()}`;
    const totalAmount = payrolls.reduce((s, p) => s + Number(p.netSalary), 0);
    const nbOfTxs = payrolls.length;

    const transactions = payrolls
      .map((p, i) => {
        const name = `${p.employee.firstName} ${p.employee.lastName}`;
        const iban = p.employee.bankAccount ?? "ES0000000000000000000000";
        const amount = Number(p.netSalary).toFixed(2);
        const ref = `NOM-${year}${String(month).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`;
        return `      <CdtTrfTxInf>
        <PmtId><EndToEndId>${ref}</EndToEndId></PmtId>
        <Amt><InstdAmt Ccy="EUR">${amount}</InstdAmt></Amt>
        <Cdtr><Nm>${name}</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>${iban}</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>Nomina ${year}/${String(month).padStart(2, "0")}</Ustrd></RmtInf>
      </CdtTrfTxInf>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</CreDtTm>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty><Nm>${companyName}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${msgId}-001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf>
      <ReqdExctnDt>${execDate}</ReqdExctnDt>
      <Dbtr><Nm>${companyName}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>PENDIENTE</IBAN></Id></DbtrAcct>
      <DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt>
${transactions}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
  }
}
