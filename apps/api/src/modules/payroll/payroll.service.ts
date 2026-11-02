import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AccountingService } from "../accounting/accounting.service";

import { computePayroll, computeSocialSecurity, isTemporaryContract, round2, PayrollEmployeeContext, ContractType } from "./payroll.calc";

interface EmployeePayrollFields {
  contractType: ContractType;
  ssContributionGroup: string | null;
  workingHours: unknown;
  startDate: Date;
  endDate: Date | null;
}

const EMPLOYEE_PAYROLL_SELECT = {
  contractType: true, ssContributionGroup: true, workingHours: true, startDate: true, endDate: true,
} as const;

const FULL_TIME_WEEKLY_HOURS = 40;

function employeeContext(emp: EmployeePayrollFields): PayrollEmployeeContext {
  const oneYearAfterStart = new Date(emp.startDate);
  oneYearAfterStart.setFullYear(oneYearAfterStart.getFullYear() + 1);
  return {
    contractType: emp.contractType,
    contributionGroup: emp.ssContributionGroup,
    partTime: Number(emp.workingHours) < FULL_TIME_WEEKLY_HOURS,
    shortContract: isTemporaryContract(emp.contractType) && !!emp.endDate && emp.endDate < oneYearAfterStart,
  };
}

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService, private accounting: AccountingService) {}

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
            contractType: true, startDate: true, endDate: true, bankAccount: true, bankHolder: true,
            ssContributionGroup: true, workingHours: true,
          },
        },
        company: {
          select: { name: true, legalName: true, cif: true, address: true, city: true },
        },
      },
    });
    if (!payroll) throw new NotFoundException("Nómina no encontrada");

    // Desglose de cotizaciones para la nómina imprimible. Si no cuadra con los importes guardados
    // (nómina de otro ejercicio o datos del empleado cambiados después) no se devuelve.
    const ss = computeSocialSecurity({
      ...employeeContext(payroll.employee),
      ordinaryPay: Number(payroll.baseSalary) + Number(payroll.bonuses) + Number(payroll.taxableAllowances),
      overtimePay: Number(payroll.overtimePay),
    });
    const matches =
      Math.abs(ss.ssEmployee - Number(payroll.ssEmployee)) < 0.005 &&
      Math.abs(ss.ssEmployer - Number(payroll.ssEmployer)) < 0.005;
    return { ...payroll, ssBreakdown: matches ? ss : null };
  }

  async generateMonthlyPayrolls(companyId: string, year: number, month: number) {
    const employees = await this.prisma.employee.findMany({
      // Los autónomos no cobran por nómina
      where: { companyId, status: "ACTIVE", contractType: { not: "AUTONOMO" } },
    });
    if (!employees.length) return [];

    const created: unknown[] = [];
    for (const emp of employees) {
      const exists = await this.prisma.payroll.findUnique({
        where: { companyId_employeeId_year_month: { companyId, employeeId: emp.id, year, month } },
      });
      if (exists) continue;

      // emp.salary es el bruto anual; 12 nóminas con las pagas extra prorrateadas
      const computed = computePayroll(Number(emp.salary) / 12, employeeContext(emp));
      const payroll = await this.prisma.payroll.create({
        data: { companyId, employeeId: emp.id, year, month, ...computed, status: "DRAFT" },
      });
      created.push((await this.attachExpenseReports(companyId, payroll.id)) ?? payroll);
    }
    return created;
  }

  // Vincula a la nómina las notas de gasto aprobadas para reembolsar por nómina y recalcula importes.
  async attachExpenseReports(companyId: string, payrollId: string) {
    const payroll = await this.prisma.payroll.findFirst({ where: { id: payrollId, companyId } });
    if (!payroll || payroll.status === "PAID") return null;

    await this.prisma.expenseReport.updateMany({
      where: {
        companyId, employeeId: payroll.employeeId, status: "APPROVED",
        reimbursementMethod: "PAYROLL", payrollId: null,
      },
      data: { payrollId: payroll.id },
    });

    const claims = await this.prisma.expenseClaim.findMany({
      where: { report: { payrollId: payroll.id, status: "APPROVED" }, status: "APPROVED", paidWithCompanyCard: false },
      select: { amount: true, taxableAmount: true },
    });
    const taxableAllowances = round2(claims.reduce((s, c) => s + Number(c.taxableAmount), 0));
    const expenseReimbursement = round2(claims.reduce((s, c) => s + Number(c.amount) - Number(c.taxableAmount), 0));

    const unchanged =
      Math.abs(Number(payroll.taxableAllowances) - taxableAllowances) < 0.005 &&
      Math.abs(Number(payroll.expenseReimbursement) - expenseReimbursement) < 0.005;
    if (unchanged) return payroll;

    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: payroll.employeeId }, select: EMPLOYEE_PAYROLL_SELECT,
    });
    const computed = computePayroll(Number(payroll.baseSalary), employeeContext(employee), {
      overtimePay: Number(payroll.overtimePay),
      bonuses: Number(payroll.bonuses),
      otherDeductions: Number(payroll.otherDeductions),
      irpfRate: Number(payroll.irpfRate),
      expenseReimbursement,
      taxableAllowances,
    });
    return this.prisma.payroll.update({
      where: { id: payroll.id },
      data: { ...computed, status: "DRAFT" },
    });
  }

  async update(companyId: string, id: string, dto: {
    overtimePay?: number;
    bonuses?: number;
    otherDeductions?: number;
    irpfRate?: number;
    notes?: string;
  }) {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id, companyId }, include: { employee: { select: EMPLOYEE_PAYROLL_SELECT } },
    });
    if (!payroll) throw new NotFoundException("Nómina no encontrada");
    if (payroll.status === "PAID") throw new ConflictException("La nómina ya está pagada");

    const computed = computePayroll(Number(payroll.baseSalary), employeeContext(payroll.employee), {
      overtimePay: dto.overtimePay,
      bonuses: dto.bonuses,
      otherDeductions: dto.otherDeductions,
      irpfRate: dto.irpfRate,
      expenseReimbursement: Number(payroll.expenseReimbursement),
      taxableAllowances: Number(payroll.taxableAllowances),
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
    const paidAt = paymentDate ? new Date(paymentDate) : new Date();
    const updated = await this.prisma.payroll.update({
      where: { id },
      data: { status: "PAID", paymentDate: paidAt },
    });

    const reports = await this.prisma.expenseReport.findMany({
      where: { companyId, payrollId: id, status: "APPROVED" },
    });
    for (const report of reports) {
      await this.prisma.$transaction([
        this.prisma.expenseReport.update({
          where: { id: report.id },
          data: { status: "REIMBURSED", reimbursedAt: paidAt },
        }),
        this.prisma.expenseClaim.updateMany({
          where: { reportId: report.id, status: "APPROVED" },
          data: { status: "REIMBURSED" },
        }),
      ]);
      await this.accounting.createExpenseReimbursementJournalEntry(companyId, {
        reference: `REEMB-${report.number}`,
        date: paidAt,
        description: `Reembolso nota de gasto ${report.number} (nómina ${payroll.month}/${payroll.year})`,
        amount: Number(report.reimbursableTotal),
        method: "PAYROLL",
      }).catch((err) => console.error("[Payroll] Failed to post reimbursement entry:", err?.message));
    }
    return updated;
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
