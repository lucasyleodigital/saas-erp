import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import type { JwtPayload } from "@saas/types";
import { PrismaService } from "../../database/prisma.service";
import { AccountingService } from "../accounting/accounting.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PayrollService } from "../payroll/payroll.service";

type Category =
  | "TRANSPORT" | "FUEL" | "TOLLS_PARKING" | "MEALS" | "ACCOMMODATION" | "PER_DIEM"
  | "MILEAGE" | "REPRESENTATION" | "SUPPLIES" | "TRAINING" | "OTHER";
type Method = "PAYROLL" | "TRANSFER" | "CASH";
type PerDiemType = "ES_OVERNIGHT" | "ES_DAY" | "ABROAD_OVERNIGHT" | "ABROAD_DAY";

export interface PolicyWarning {
  code: string;
  message: string;
  severity: "warning" | "info";
}

const CATEGORIES: Category[] = [
  "TRANSPORT", "FUEL", "TOLLS_PARKING", "MEALS", "ACCOMMODATION", "PER_DIEM",
  "MILEAGE", "REPRESENTATION", "SUPPLIES", "TRAINING", "OTHER",
];

const CATEGORY_LABEL: Record<Category, string> = {
  TRANSPORT: "Transporte",
  FUEL: "Combustible",
  TOLLS_PARKING: "Peajes y parking",
  MEALS: "Manutención",
  ACCOMMODATION: "Alojamiento",
  PER_DIEM: "Dietas",
  MILEAGE: "Kilometraje",
  REPRESENTATION: "Representación",
  SUPPLIES: "Material",
  TRAINING: "Formación",
  OTHER: "Otros",
};

// Límites exentos de IRPF — art. 9 RIRPF (manutención) y Orden HFP/792/2023 (0,26 €/km)
const LEGAL_MILEAGE_RATE = 0.26;
const LEGAL_PER_DIEM: Record<PerDiemType, number> = {
  ES_OVERNIGHT: 53.34,
  ES_DAY: 26.67,
  ABROAD_OVERNIGHT: 91.35,
  ABROAD_DAY: 48.08,
};
const PER_DIEM_SETTING: Record<PerDiemType, string> = {
  ES_OVERNIGHT: "perDiemEsOvernight",
  ES_DAY: "perDiemEsDay",
  ABROAD_OVERNIGHT: "perDiemAbroadOvernight",
  ABROAD_DAY: "perDiemAbroadDay",
};

const NO_RECEIPT_CATEGORIES: Category[] = ["MILEAGE", "PER_DIEM"];

// Cuenta PGC del gasto según categoría
const CATEGORY_ACCOUNT: Record<Category, string> = {
  TRANSPORT: "629",
  FUEL: "628",
  TOLLS_PARKING: "629",
  MEALS: "629",
  ACCOMMODATION: "629",
  PER_DIEM: "629",
  MILEAGE: "629",
  REPRESENTATION: "627",
  SUPPLIES: "629",
  TRAINING: "649",
  OTHER: "629",
};

// Categoría del módulo fiscal (modelos 303/130)
const CATEGORY_FISCAL: Record<Category, string> = {
  TRANSPORT: "TRANSPORTE",
  FUEL: "TRANSPORTE",
  TOLLS_PARKING: "TRANSPORTE",
  MEALS: "OTROS",
  ACCOMMODATION: "OTROS",
  PER_DIEM: "OTROS",
  MILEAGE: "OTROS",
  REPRESENTATION: "MARKETING",
  SUPPLIES: "OFICINA",
  TRAINING: "FORMACION",
  OTHER: "OTROS",
};

const APPROVER_ROLES = ["SUPER_ADMIN", "OWNER", "ADMIN", "ACCOUNTANT"];
const EDITABLE_STATUSES = ["DRAFT", "REJECTED"];

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtEur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

function parseDate(value: unknown, field = "fecha"): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) {
    throw new BadRequestException(`La ${field} debe tener formato AAAA-MM-DD`);
  }
  const d = new Date(value.slice(0, 10) + "T00:00:00.000Z");
  if (isNaN(d.getTime())) throw new BadRequestException(`La ${field} no es válida`);
  return d;
}

function toNumber(value: unknown, field: string, opts: { min?: number; max?: number } = {}): number {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  if (!Number.isFinite(n)) throw new BadRequestException(`${field} no es un número válido`);
  if (opts.min !== undefined && n < opts.min) throw new BadRequestException(`${field} debe ser como mínimo ${opts.min}`);
  if (opts.max !== undefined && n > opts.max) throw new BadRequestException(`${field} no puede superar ${opts.max}`);
  return n;
}

function optString(value: unknown, max = 300): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s ? s.slice(0, max) : null;
}

@Injectable()
export class ExpenseClaimsService {
  constructor(
    private prisma: PrismaService,
    private accounting: AccountingService,
    private notifications: NotificationsService,
    private payroll: PayrollService,
  ) {}

  // ─── Contexto del usuario ─────────────────────────────────────────────────

  private async context(u: JwtPayload) {
    const employee = await this.prisma.employee.findFirst({
      where: { companyId: u.companyId, email: { equals: u.email, mode: "insensitive" } },
      select: { id: true, firstName: true, lastName: true, department: true },
    });
    return { employee, canApprove: APPROVER_ROLES.includes(u.role) };
  }

  private requireApprover(canApprove: boolean) {
    if (!canApprove) throw new ForbiddenException("Solo administración puede realizar esta acción");
  }

  async me(u: JwtPayload) {
    const { employee, canApprove } = await this.context(u);
    const settings = await this.getSettings(u.companyId);
    return { employee, canApprove, settings, legal: { mileageRate: LEGAL_MILEAGE_RATE, perDiem: LEGAL_PER_DIEM } };
  }

  // ─── Configuración y políticas ────────────────────────────────────────────

  async getSettings(companyId: string) {
    return this.prisma.expenseSettings.upsert({
      where: { companyId },
      update: {},
      create: { companyId },
    });
  }

  async updateSettings(u: JwtPayload, body: any) {
    const { canApprove } = await this.context(u);
    this.requireApprover(canApprove);
    const data: Record<string, unknown> = {};
    const rateFields = ["mileageRate", "perDiemEsOvernight", "perDiemEsDay", "perDiemAbroadOvernight", "perDiemAbroadDay"];
    for (const f of rateFields) {
      if (body[f] !== undefined) data[f] = toNumber(body[f], f, { min: 0, max: f === "mileageRate" ? 5 : 1000 });
    }
    if (body.maxDaysOld !== undefined) data.maxDaysOld = Math.round(toNumber(body.maxDaysOld, "maxDaysOld", { min: 1, max: 3650 }));
    for (const f of ["requireProject", "autoPostAccounting"]) {
      if (body[f] !== undefined) data[f] = Boolean(body[f]);
    }
    if (body.defaultReimbursement !== undefined) {
      if (!["PAYROLL", "TRANSFER", "CASH"].includes(body.defaultReimbursement)) {
        throw new BadRequestException("Método de reembolso no válido");
      }
      data.defaultReimbursement = body.defaultReimbursement;
    }
    return this.prisma.expenseSettings.upsert({
      where: { companyId: u.companyId },
      update: data,
      create: { companyId: u.companyId, ...data },
    });
  }

  async getPolicies(companyId: string) {
    return this.prisma.expensePolicy.findMany({ where: { companyId }, orderBy: { category: "asc" } });
  }

  async savePolicies(u: JwtPayload, body: any) {
    const { canApprove } = await this.context(u);
    this.requireApprover(canApprove);
    const rows = Array.isArray(body?.policies) ? body.policies : [];
    for (const row of rows) {
      if (!CATEGORIES.includes(row.category)) throw new BadRequestException("Categoría no válida");
      const maxAmount = row.maxAmount === null || row.maxAmount === "" || row.maxAmount === undefined
        ? null
        : toNumber(row.maxAmount, "Importe máximo", { min: 0, max: 1_000_000 });
      const data = {
        maxAmount,
        requiresReceipt: row.requiresReceipt !== false,
        isActive: row.isActive !== false,
      };
      await this.prisma.expensePolicy.upsert({
        where: { companyId_category: { companyId: u.companyId, category: row.category } },
        update: data,
        create: { companyId: u.companyId, category: row.category, ...data },
      });
    }
    return this.getPolicies(u.companyId);
  }

  // ─── Cálculo de importes y políticas ──────────────────────────────────────

  private computeAmounts(settings: any, input: any) {
    const category = input.category as Category;

    if (category === "MILEAGE") {
      const km = toNumber(input.distanceKm, "Kilómetros", { min: 0.1, max: 20000 });
      const rate = Number(settings.mileageRate);
      const amount = round2(km * rate);
      const exempt = Math.min(amount, round2(km * LEGAL_MILEAGE_RATE));
      return {
        amount, exemptAmount: exempt, taxableAmount: round2(amount - exempt),
        distanceKm: km, mileageRate: rate, perDiemType: null, perDiemDays: null,
        vatRate: 0, vatDeductible: false,
      };
    }

    if (category === "PER_DIEM") {
      const type = input.perDiemType as PerDiemType;
      if (!LEGAL_PER_DIEM[type]) throw new BadRequestException("Tipo de dieta no válido");
      const days = toNumber(input.perDiemDays, "Días", { min: 0.5, max: 270 });
      const rate = Number(settings[PER_DIEM_SETTING[type]]);
      const amount = round2(days * rate);
      const exempt = Math.min(amount, round2(days * LEGAL_PER_DIEM[type]));
      return {
        amount, exemptAmount: exempt, taxableAmount: round2(amount - exempt),
        distanceKm: null, mileageRate: null, perDiemType: type, perDiemDays: days,
        vatRate: 0, vatDeductible: false,
      };
    }

    const amount = round2(toNumber(input.amount, "Importe", { min: 0.01, max: 1_000_000 }));
    const vatRate = input.vatRate === undefined || input.vatRate === "" ? 0 : toNumber(input.vatRate, "IVA", { min: 0, max: 30 });
    return {
      amount, exemptAmount: amount, taxableAmount: 0,
      distanceKm: null, mileageRate: null, perDiemType: null, perDiemDays: null,
      vatRate, vatDeductible: Boolean(input.vatDeductible) && vatRate > 0,
    };
  }

  private async evaluatePolicies(
    companyId: string,
    settings: any,
    claim: {
      id?: string; employeeId: string; category: Category; date: Date; amount: number;
      receiptUrl: string | null; projectId: string | null; taxableAmount: number;
      vatDeductible: boolean; merchantNif: string | null;
    },
  ): Promise<PolicyWarning[]> {
    const warnings: PolicyWarning[] = [];
    const policy = await this.prisma.expensePolicy.findUnique({
      where: { companyId_category: { companyId, category: claim.category } },
    });

    if (policy?.isActive !== false && policy?.maxAmount != null && claim.amount > Number(policy.maxAmount)) {
      warnings.push({
        code: "OVER_LIMIT", severity: "warning",
        message: `Supera el máximo de la política para ${CATEGORY_LABEL[claim.category].toLowerCase()} (${fmtEur(Number(policy.maxAmount))})`,
      });
    }

    const receiptRequired = !NO_RECEIPT_CATEGORIES.includes(claim.category) && (policy?.isActive === false ? false : policy?.requiresReceipt ?? true);
    if (receiptRequired && !claim.receiptUrl) {
      warnings.push({ code: "MISSING_RECEIPT", severity: "warning", message: "Falta el ticket o factura justificativa" });
    }

    const dayStart = claim.date;
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const duplicate = await this.prisma.expenseClaim.findFirst({
      where: {
        companyId,
        employeeId: claim.employeeId,
        category: claim.category,
        date: { gte: dayStart, lt: dayEnd },
        amount: claim.amount,
        status: { not: "REJECTED" },
        ...(claim.id && { id: { not: claim.id } }),
      },
      select: { id: true },
    });
    if (duplicate) {
      warnings.push({ code: "DUPLICATE", severity: "warning", message: "Posible duplicado: hay otro gasto igual el mismo día" });
    }

    const now = new Date();
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    if (claim.date >= todayEnd) {
      warnings.push({ code: "FUTURE_DATE", severity: "warning", message: "La fecha del gasto es futura" });
    }
    const oldest = new Date(todayEnd.getTime() - (Number(settings.maxDaysOld) + 1) * 24 * 60 * 60 * 1000);
    if (claim.date < oldest) {
      warnings.push({ code: "TOO_OLD", severity: "warning", message: `Gasto con más de ${settings.maxDaysOld} días de antigüedad` });
    }

    const weekday = claim.date.getUTCDay();
    if (weekday === 0 || weekday === 6) {
      warnings.push({ code: "WEEKEND", severity: "info", message: "Gasto en fin de semana" });
    }

    if (claim.taxableAmount > 0) {
      const what = claim.category === "MILEAGE" ? "0,26 €/km" : "los límites de dietas del art. 9 RIRPF";
      warnings.push({
        code: "TAXABLE_EXCESS", severity: "info",
        message: `${fmtEur(claim.taxableAmount)} superan ${what} y tributan como salario en nómina`,
      });
    }

    if (claim.category === "MEALS") {
      const sameDay = await this.prisma.expenseClaim.aggregate({
        where: {
          companyId, employeeId: claim.employeeId, category: "MEALS",
          date: { gte: dayStart, lt: dayEnd }, status: { not: "REJECTED" },
          ...(claim.id && { id: { not: claim.id } }),
        },
        _sum: { amount: true },
      });
      const dayTotal = Number(sameDay._sum.amount ?? 0) + claim.amount;
      if (dayTotal > LEGAL_PER_DIEM.ES_OVERNIGHT) {
        warnings.push({
          code: "MEALS_DAILY_LIMIT", severity: "info",
          message: `Manutención del día: ${fmtEur(dayTotal)}. Supera ${fmtEur(LEGAL_PER_DIEM.ES_OVERNIGHT)}/día exentos en España; si son comidas del empleado, el exceso puede tributar`,
        });
      }
    }

    if (settings.requireProject && !claim.projectId) {
      warnings.push({ code: "NO_PROJECT", severity: "warning", message: "La política exige asignar el gasto a un proyecto" });
    }

    if (claim.vatDeductible && !claim.merchantNif) {
      warnings.push({
        code: "VAT_WITHOUT_NIF", severity: "warning",
        message: "Para deducir el IVA la factura debe incluir el NIF del emisor y los datos de la empresa",
      });
    }

    return warnings;
  }

  // ─── Gastos (líneas) ──────────────────────────────────────────────────────

  private claimInclude = {
    employee: { select: { id: true, firstName: true, lastName: true } },
    project: { select: { id: true, name: true, color: true } },
    vehicle: { select: { id: true, matricula: true } },
    report: { select: { id: true, number: true, status: true } },
  } as const;

  async listClaims(u: JwtPayload, q: any) {
    const { employee, canApprove } = await this.context(u);
    const where: any = { companyId: u.companyId };

    if (!canApprove) {
      if (!employee) return [];
      where.employeeId = employee.id;
    } else if (q.employeeId) {
      where.employeeId = q.employeeId;
    } else if (q.mine === "true") {
      if (!employee) return [];
      where.employeeId = employee.id;
    }

    if (q.status) where.status = { in: String(q.status).split(",") };
    if (q.reportId) where.reportId = q.reportId;
    if (q.projectId) where.projectId = q.projectId;
    if (q.vehicleId) where.vehicleId = q.vehicleId;
    if (q.category) where.category = q.category;
    if (q.unreported === "true") {
      where.status = { in: EDITABLE_STATUSES };
    }
    if (q.from || q.to) {
      where.date = {};
      if (q.from) where.date.gte = parseDate(q.from, "fecha desde");
      if (q.to) where.date.lte = parseDate(q.to, "fecha hasta");
    }

    return this.prisma.expenseClaim.findMany({
      where,
      include: this.claimInclude,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 500,
    });
  }

  private async resolveEmployeeId(u: JwtPayload, requested: unknown) {
    const { employee, canApprove } = await this.context(u);
    if (canApprove && typeof requested === "string" && requested) {
      const target = await this.prisma.employee.findFirst({
        where: { id: requested, companyId: u.companyId },
        select: { id: true },
      });
      if (!target) throw new NotFoundException("Empleado no encontrado");
      return target.id;
    }
    if (!employee) {
      throw new ForbiddenException(
        "Tu usuario no está vinculado a ningún empleado. Crea un empleado con tu mismo email para registrar gastos.",
      );
    }
    return employee.id;
  }

  private async validateLinks(companyId: string, projectId: string | null, vehicleId: string | null) {
    if (projectId) {
      const p = await this.prisma.project.findFirst({ where: { id: projectId, companyId }, select: { id: true } });
      if (!p) throw new NotFoundException("Proyecto no encontrado");
    }
    if (vehicleId) {
      const v = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, companyId }, select: { id: true } });
      if (!v) throw new NotFoundException("Vehículo no encontrado");
    }
  }

  private async buildClaimData(companyId: string, employeeId: string, input: any, claimId?: string) {
    if (!CATEGORIES.includes(input.category)) throw new BadRequestException("Categoría no válida");
    const settings = await this.getSettings(companyId);
    const amounts = this.computeAmounts(settings, input);
    const date = parseDate(input.date);
    const projectId = optString(input.projectId, 64);
    const vehicleId = optString(input.vehicleId, 64);
    await this.validateLinks(companyId, projectId, vehicleId);

    const receiptUrl = optString(input.receiptUrl, 1000);
    if (receiptUrl && !/^https:\/\//.test(receiptUrl)) throw new BadRequestException("URL del justificante no válida");
    const merchantNif = optString(input.merchantNif, 20);

    const policyWarnings = await this.evaluatePolicies(companyId, settings, {
      id: claimId, employeeId, category: input.category, date, amount: amounts.amount,
      receiptUrl, projectId, taxableAmount: amounts.taxableAmount,
      vatDeductible: amounts.vatDeductible, merchantNif,
    });

    return {
      employeeId,
      category: input.category as Category,
      date,
      merchant: optString(input.merchant, 150),
      merchantNif,
      description: optString(input.description, 500),
      origin: input.category === "MILEAGE" ? optString(input.origin, 150) : null,
      destination: input.category === "MILEAGE" ? optString(input.destination, 150) : null,
      receiptUrl,
      paidWithCompanyCard: NO_RECEIPT_CATEGORIES.includes(input.category) ? false : Boolean(input.paidWithCompanyCard),
      projectId,
      vehicleId,
      ...amounts,
      policyWarnings: policyWarnings as any,
    };
  }

  async createClaim(u: JwtPayload, body: any) {
    const employeeId = await this.resolveEmployeeId(u, body?.employeeId);
    const data = await this.buildClaimData(u.companyId, employeeId, body ?? {});
    return this.prisma.expenseClaim.create({
      data: { companyId: u.companyId, status: "DRAFT", ...data },
      include: this.claimInclude,
    });
  }

  private async findAccessibleClaim(u: JwtPayload, id: string) {
    const { employee, canApprove } = await this.context(u);
    const claim = await this.prisma.expenseClaim.findFirst({ where: { id, companyId: u.companyId } });
    if (!claim) throw new NotFoundException("Gasto no encontrado");
    if (!canApprove && claim.employeeId !== employee?.id) throw new ForbiddenException("No puedes acceder a este gasto");
    return claim;
  }

  async updateClaim(u: JwtPayload, id: string, body: any) {
    const claim = await this.findAccessibleClaim(u, id);
    if (!EDITABLE_STATUSES.includes(claim.status)) {
      throw new BadRequestException("Solo se pueden editar gastos en borrador o rechazados");
    }
    const merged = {
      category: claim.category,
      date: claim.date.toISOString().slice(0, 10),
      merchant: claim.merchant,
      merchantNif: claim.merchantNif,
      description: claim.description,
      amount: Number(claim.amount),
      vatRate: Number(claim.vatRate),
      vatDeductible: claim.vatDeductible,
      receiptUrl: claim.receiptUrl,
      paidWithCompanyCard: claim.paidWithCompanyCard,
      distanceKm: claim.distanceKm != null ? Number(claim.distanceKm) : undefined,
      origin: claim.origin,
      destination: claim.destination,
      perDiemType: claim.perDiemType,
      perDiemDays: claim.perDiemDays != null ? Number(claim.perDiemDays) : undefined,
      projectId: claim.projectId,
      vehicleId: claim.vehicleId,
      ...body,
    };
    const data = await this.buildClaimData(u.companyId, claim.employeeId, merged, claim.id);
    return this.prisma.expenseClaim.update({
      where: { id },
      data: { ...data, employeeId: claim.employeeId, status: "DRAFT", reportId: null, rejectionReason: null },
      include: this.claimInclude,
    });
  }

  async removeClaim(u: JwtPayload, id: string) {
    const claim = await this.findAccessibleClaim(u, id);
    if (!EDITABLE_STATUSES.includes(claim.status)) {
      throw new BadRequestException("Solo se pueden eliminar gastos en borrador o rechazados");
    }
    await this.prisma.expenseClaim.delete({ where: { id } });
    return { success: true };
  }

  // ─── Notas de gasto ───────────────────────────────────────────────────────

  async listReports(u: JwtPayload, q: any) {
    const { employee, canApprove } = await this.context(u);
    const where: any = { companyId: u.companyId };
    if (!canApprove) {
      if (!employee) return [];
      where.employeeId = employee.id;
    } else if (q.employeeId) {
      where.employeeId = q.employeeId;
    }
    if (q.status) where.status = { in: String(q.status).split(",") };

    return this.prisma.expenseReport.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        payroll: { select: { id: true, month: true, year: true, status: true } },
        _count: { select: { claims: true } },
        claims: { select: { policyWarnings: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 300,
    }).then((reports) =>
      reports.map(({ claims, ...r }) => ({
        ...r,
        warningsCount: claims.reduce(
          (s, c) => s + ((c.policyWarnings as PolicyWarning[] | null) ?? []).filter((w) => w.severity === "warning").length,
          0,
        ),
      })),
    );
  }

  async getReport(u: JwtPayload, id: string) {
    const { employee, canApprove } = await this.context(u);
    const report = await this.prisma.expenseReport.findFirst({
      where: { id, companyId: u.companyId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, nif: true, department: true, position: true } },
        payroll: { select: { id: true, month: true, year: true, status: true } },
        claims: { include: this.claimInclude, orderBy: { date: "asc" } },
      },
    });
    if (!report) throw new NotFoundException("Nota de gasto no encontrada");
    if (!canApprove && report.employeeId !== employee?.id) throw new ForbiddenException("No puedes acceder a esta nota de gasto");
    return { ...report, canApprove, isOwn: report.employeeId === employee?.id };
  }

  private async nextReportNumber(companyId: string) {
    const year = new Date().getFullYear();
    const prefix = `NG-${year}-`;
    const last = await this.prisma.expenseReport.findFirst({
      where: { companyId, number: { startsWith: prefix } },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const next = last ? parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
    return `${prefix}${String(next).padStart(4, "0")}`;
  }

  async createReport(u: JwtPayload, body: any) {
    const ids: string[] = Array.isArray(body?.claimIds) ? body.claimIds.filter((x: unknown) => typeof x === "string") : [];
    if (!ids.length) throw new BadRequestException("Selecciona al menos un gasto");

    const { employee, canApprove } = await this.context(u);
    const claims = await this.prisma.expenseClaim.findMany({ where: { id: { in: ids }, companyId: u.companyId } });
    if (claims.length !== ids.length) throw new NotFoundException("Algún gasto no existe");

    const employeeIds = new Set(claims.map((c) => c.employeeId));
    if (employeeIds.size > 1) throw new BadRequestException("Una nota de gasto solo puede incluir gastos de un empleado");
    const employeeId = claims[0]!.employeeId;
    if (!canApprove && employeeId !== employee?.id) throw new ForbiddenException("Solo puedes enviar tus propios gastos");
    if (claims.some((c) => !EDITABLE_STATUSES.includes(c.status))) {
      throw new BadRequestException("Solo se pueden enviar gastos en borrador o rechazados");
    }

    const settings = await this.getSettings(u.companyId);
    const total = round2(claims.reduce((s, c) => s + Number(c.amount), 0));
    const months = [...new Set(claims.map((c) => c.date.toISOString().slice(0, 7)))].sort();
    const monthName = (ym: string) =>
      new Date(ym + "-01T00:00:00Z").toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });
    const defaultTitle = months.length === 1
      ? `Gastos de ${monthName(months[0]!)}`
      : `Gastos ${monthName(months[0]!)} – ${monthName(months[months.length - 1]!)}`;

    const report = await this.prisma.$transaction(async (tx) => {
      const created = await tx.expenseReport.create({
        data: {
          companyId: u.companyId,
          employeeId,
          number: await this.nextReportNumber(u.companyId),
          title: optString(body.title, 150) ?? defaultTitle,
          status: "PENDING",
          total,
        },
      });
      for (const c of claims) {
        const warnings = await this.evaluatePolicies(u.companyId, settings, {
          id: c.id, employeeId: c.employeeId, category: c.category as Category, date: c.date,
          amount: Number(c.amount), receiptUrl: c.receiptUrl, projectId: c.projectId,
          taxableAmount: Number(c.taxableAmount), vatDeductible: c.vatDeductible, merchantNif: c.merchantNif,
        });
        await tx.expenseClaim.update({
          where: { id: c.id },
          data: { reportId: created.id, status: "PENDING", rejectionReason: null, policyWarnings: warnings as any },
        });
      }
      return created;
    });

    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId }, select: { firstName: true, lastName: true } });
    await this.notifyApprovers(u.companyId, u.sub, {
      title: `Nota de gasto ${report.number} pendiente`,
      body: `${emp?.firstName ?? ""} ${emp?.lastName ?? ""} ha enviado ${claims.length} gasto(s) por ${fmtEur(total)}`,
      data: { type: "EXPENSE_REPORT", reportId: report.id, link: "/gastos" },
    });

    return report;
  }

  async withdrawReport(u: JwtPayload, id: string) {
    const report = await this.getReport(u, id);
    if (report.status !== "PENDING") throw new BadRequestException("Solo se pueden retirar notas pendientes de aprobación");
    await this.prisma.$transaction([
      this.prisma.expenseClaim.updateMany({
        where: { reportId: id },
        data: { reportId: null, status: "DRAFT" },
      }),
      this.prisma.expenseReport.delete({ where: { id } }),
    ]);
    return { success: true };
  }

  async approveReport(u: JwtPayload, id: string, body: any) {
    const { employee, canApprove } = await this.context(u);
    this.requireApprover(canApprove);

    const report = await this.prisma.expenseReport.findFirst({
      where: { id, companyId: u.companyId },
      include: {
        claims: true,
        employee: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!report) throw new NotFoundException("Nota de gasto no encontrada");
    if (report.status !== "PENDING") throw new BadRequestException("La nota no está pendiente de aprobación");
    if (report.employeeId === employee?.id && !["OWNER", "SUPER_ADMIN"].includes(u.role)) {
      throw new ForbiddenException("No puedes aprobar tus propios gastos");
    }

    const settings = await this.getSettings(u.companyId);
    const method: Method = ["PAYROLL", "TRANSFER", "CASH"].includes(body?.reimbursementMethod)
      ? body.reimbursementMethod
      : (settings.defaultReimbursement as Method);

    const rejected = new Map<string, string>();
    for (const r of Array.isArray(body?.rejectedClaims) ? body.rejectedClaims : []) {
      if (typeof r?.id === "string") rejected.set(r.id, optString(r.reason, 300) ?? "Rechazado por administración");
    }

    const approvedClaims = report.claims.filter((c) => !rejected.has(c.id));
    if (!approvedClaims.length) {
      return this.rejectReport(u, id, { reason: "Todas las líneas han sido rechazadas" });
    }

    const approvedTotal = round2(approvedClaims.reduce((s, c) => s + Number(c.amount), 0));
    const reimbursableTotal = round2(
      approvedClaims.filter((c) => !c.paidWithCompanyCard).reduce((s, c) => s + Number(c.amount), 0),
    );
    const nothingToReimburse = reimbursableTotal === 0;

    const approver = await this.prisma.user.findUnique({ where: { id: u.sub }, select: { firstName: true, lastName: true } });
    const now = new Date();

    await this.prisma.$transaction([
      ...[...rejected.entries()].map(([claimId, reason]) =>
        this.prisma.expenseClaim.updateMany({
          where: { id: claimId, reportId: id },
          data: { status: "REJECTED", rejectionReason: reason },
        }),
      ),
      this.prisma.expenseClaim.updateMany({
        where: { id: { in: approvedClaims.map((c) => c.id) } },
        data: { status: nothingToReimburse ? "REIMBURSED" : "APPROVED" },
      }),
      this.prisma.expenseReport.update({
        where: { id },
        data: {
          status: nothingToReimburse ? "REIMBURSED" : "APPROVED",
          approvedAt: now,
          approvedById: u.sub,
          approverName: approver ? `${approver.firstName} ${approver.lastName}`.trim() : null,
          approvedTotal,
          reimbursableTotal,
          reimbursementMethod: nothingToReimburse ? null : method,
          reimbursedAt: nothingToReimburse ? now : null,
          rejectionReason: null,
        },
      }),
    ]);

    if (settings.autoPostAccounting) {
      const employeeName = `${report.employee.firstName} ${report.employee.lastName}`.trim();
      for (const c of approvedClaims) {
        await this.postClaimToBooks(u.companyId, report.number, employeeName, c).catch((err) =>
          console.error("[ExpenseClaims] Failed to post claim to books:", err?.message),
        );
      }
    }

    if (method === "PAYROLL" && !nothingToReimburse) {
      const openPayroll = await this.prisma.payroll.findFirst({
        where: { companyId: u.companyId, employeeId: report.employeeId, status: { in: ["DRAFT", "APPROVED"] } },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        select: { id: true },
      });
      if (openPayroll) await this.payroll.attachExpenseReports(u.companyId, openPayroll.id);
    }

    const howPaid = nothingToReimburse
      ? "Pagado con tarjeta de empresa, no hay nada que reembolsar."
      : method === "PAYROLL" ? "Se reembolsará en tu próxima nómina." : "Se reembolsará por transferencia o en efectivo.";
    await this.notifyEmployee(u.companyId, report.employee.email, {
      title: `Nota de gasto ${report.number} aprobada`,
      body: `Aprobados ${fmtEur(approvedTotal)}${rejected.size ? ` (${rejected.size} línea(s) rechazada(s))` : ""}. ${howPaid}`,
      data: { type: "EXPENSE_REPORT", reportId: id, link: "/gastos" },
    });

    return this.getReport(u, id);
  }

  // Crea el gasto deducible (modelos 303/130) y su asiento contra la 465 o la 572
  private async postClaimToBooks(companyId: string, reportNumber: string, employeeName: string, claim: any) {
    const category = claim.category as Category;
    const amount = Number(claim.amount);
    const vatRate = claim.vatDeductible ? Number(claim.vatRate) : 0;
    const subtotal = round2(vatRate > 0 ? amount / (1 + vatRate / 100) : amount);
    const vatAmount = round2(amount - subtotal);
    const concept = claim.merchant || claim.description || CATEGORY_LABEL[category];
    const description = `${CATEGORY_LABEL[category]}: ${concept} · ${employeeName} (${reportNumber})`.slice(0, 250);

    const fiscal = await this.prisma.expense.create({
      data: {
        companyId,
        date: claim.date,
        description,
        supplier: NO_RECEIPT_CATEGORIES.includes(category) ? employeeName : (claim.merchant ?? employeeName),
        supplierNif: claim.merchantNif ?? null,
        subtotal,
        vatRate,
        vatAmount,
        total: amount,
        category: CATEGORY_FISCAL[category],
        isDeductible: true,
        attachmentUrl: claim.receiptUrl ?? null,
      },
    });

    await this.accounting.createExpenseClaimJournalEntry(companyId, {
      reference: `GASTO-${fiscal.id.slice(0, 8).toUpperCase()}`,
      date: claim.date,
      description,
      expenseAccountCode: CATEGORY_ACCOUNT[category],
      base: subtotal,
      vatAmount,
      taxableAmount: Math.min(Number(claim.taxableAmount), subtotal),
      paidWithCompanyCard: claim.paidWithCompanyCard,
    });

    await this.prisma.expenseClaim.update({ where: { id: claim.id }, data: { fiscalExpenseId: fiscal.id } });
  }

  private async unpostClaims(companyId: string, claims: { id: string; fiscalExpenseId: string | null }[]) {
    const fiscalIds = claims.map((c) => c.fiscalExpenseId).filter((x): x is string => !!x);
    if (!fiscalIds.length) return;
    await this.accounting.deleteJournalEntriesByReference(
      companyId,
      fiscalIds.map((fid) => `GASTO-${fid.slice(0, 8).toUpperCase()}`),
    );
    await this.prisma.expense.deleteMany({ where: { companyId, id: { in: fiscalIds } } });
    await this.prisma.expenseClaim.updateMany({
      where: { id: { in: claims.map((c) => c.id) } },
      data: { fiscalExpenseId: null },
    });
  }

  async rejectReport(u: JwtPayload, id: string, body: any) {
    const { canApprove } = await this.context(u);
    this.requireApprover(canApprove);
    const report = await this.prisma.expenseReport.findFirst({
      where: { id, companyId: u.companyId },
      include: { employee: { select: { email: true } } },
    });
    if (!report) throw new NotFoundException("Nota de gasto no encontrada");
    if (report.status !== "PENDING") throw new BadRequestException("La nota no está pendiente de aprobación");

    const reason = optString(body?.reason, 500);
    if (!reason) throw new BadRequestException("Indica el motivo del rechazo");

    await this.prisma.$transaction([
      this.prisma.expenseClaim.updateMany({
        where: { reportId: id },
        data: { status: "REJECTED", rejectionReason: reason },
      }),
      this.prisma.expenseReport.update({
        where: { id },
        data: { status: "REJECTED", rejectionReason: reason, approvedTotal: 0, reimbursableTotal: 0 },
      }),
    ]);

    await this.notifyEmployee(u.companyId, report.employee.email, {
      title: `Nota de gasto ${report.number} rechazada`,
      body: `Motivo: ${reason}. Puedes corregir los gastos y volver a enviarlos.`,
      data: { type: "EXPENSE_REPORT", reportId: id, link: "/gastos" },
    });

    return this.getReport(u, id);
  }

  async reopenReport(u: JwtPayload, id: string) {
    const { canApprove } = await this.context(u);
    this.requireApprover(canApprove);
    const report = await this.prisma.expenseReport.findFirst({
      where: { id, companyId: u.companyId },
      include: { claims: { select: { id: true, fiscalExpenseId: true } }, payroll: { select: { id: true, status: true } } },
    });
    if (!report) throw new NotFoundException("Nota de gasto no encontrada");
    if (report.status !== "APPROVED") {
      throw new BadRequestException("Solo se pueden reabrir notas aprobadas y pendientes de reembolso");
    }
    if (report.payroll?.status === "PAID") throw new BadRequestException("La nómina asociada ya está pagada");

    await this.unpostClaims(u.companyId, report.claims);
    await this.prisma.$transaction([
      this.prisma.expenseClaim.updateMany({
        where: { reportId: id },
        data: { status: "PENDING", rejectionReason: null },
      }),
      this.prisma.expenseReport.update({
        where: { id },
        data: {
          status: "PENDING", approvedAt: null, approvedById: null, approverName: null,
          approvedTotal: 0, reimbursableTotal: 0, reimbursementMethod: null, payrollId: null,
        },
      }),
    ]);
    if (report.payroll) await this.payroll.attachExpenseReports(u.companyId, report.payroll.id);

    return this.getReport(u, id);
  }

  async reimburseReport(u: JwtPayload, id: string, body: any) {
    const { canApprove } = await this.context(u);
    this.requireApprover(canApprove);
    const report = await this.prisma.expenseReport.findFirst({
      where: { id, companyId: u.companyId },
      include: { employee: { select: { email: true } }, payroll: { select: { id: true, status: true } } },
    });
    if (!report) throw new NotFoundException("Nota de gasto no encontrada");
    if (report.status !== "APPROVED") throw new BadRequestException("La nota debe estar aprobada");

    const method: Method = body?.method === "CASH" ? "CASH" : "TRANSFER";
    if (report.payroll?.status === "PAID") throw new BadRequestException("Ya se reembolsó con la nómina");
    const paidAt = body?.date ? parseDate(body.date, "fecha de pago") : new Date();

    await this.prisma.$transaction([
      this.prisma.expenseReport.update({
        where: { id },
        data: { status: "REIMBURSED", reimbursedAt: paidAt, reimbursementMethod: method, payrollId: null },
      }),
      this.prisma.expenseClaim.updateMany({
        where: { reportId: id, status: "APPROVED" },
        data: { status: "REIMBURSED" },
      }),
    ]);
    if (report.payroll) await this.payroll.attachExpenseReports(u.companyId, report.payroll.id);

    await this.accounting.createExpenseReimbursementJournalEntry(u.companyId, {
      reference: `REEMB-${report.number}`,
      date: paidAt,
      description: `Reembolso nota de gasto ${report.number}`,
      amount: Number(report.reimbursableTotal),
      method,
    }).catch((err) => console.error("[ExpenseClaims] Failed to post reimbursement:", err?.message));

    await this.notifyEmployee(u.companyId, report.employee.email, {
      title: `Nota de gasto ${report.number} reembolsada`,
      body: `Te hemos pagado ${fmtEur(Number(report.reimbursableTotal))} ${method === "CASH" ? "en efectivo" : "por transferencia"}.`,
      data: { type: "EXPENSE_REPORT", reportId: id, link: "/gastos" },
    });

    return this.getReport(u, id);
  }

  // ─── Analítica ────────────────────────────────────────────────────────────

  async analytics(u: JwtPayload, q: any) {
    const { canApprove } = await this.context(u);
    this.requireApprover(canApprove);

    const to = q.to ? parseDate(q.to, "fecha hasta") : new Date();
    const from = q.from
      ? parseDate(q.from, "fecha desde")
      : new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));
    const toEnd = new Date(to.getTime() + 24 * 60 * 60 * 1000);

    const [claims, pendingClaims, approvedReports] = await Promise.all([
      this.prisma.expenseClaim.findMany({
        where: { companyId: u.companyId, status: { in: ["APPROVED", "REIMBURSED"] }, date: { gte: from, lt: toEnd } },
        select: {
          amount: true, vatRate: true, vatDeductible: true, category: true, date: true,
          policyWarnings: true, paidWithCompanyCard: true, employeeId: true, projectId: true, vehicleId: true,
          employee: { select: { firstName: true, lastName: true } },
          project: { select: { name: true, color: true } },
          vehicle: { select: { matricula: true } },
        },
      }),
      this.prisma.expenseClaim.aggregate({
        where: { companyId: u.companyId, status: "PENDING" },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expenseReport.aggregate({
        where: { companyId: u.companyId, status: "APPROVED" },
        _sum: { reimbursableTotal: true },
        _count: true,
      }),
    ]);

    const add = <K extends string>(map: Map<K, { amount: number; count: number; label: string; color?: string | null }>, key: K, label: string, amount: number, color?: string | null) => {
      const cur = map.get(key) ?? { amount: 0, count: 0, label, color };
      cur.amount = round2(cur.amount + amount);
      cur.count += 1;
      map.set(key, cur);
    };

    const byCategory = new Map<string, any>();
    const byEmployee = new Map<string, any>();
    const byProject = new Map<string, any>();
    const byVehicle = new Map<string, any>();
    const byMonth = new Map<string, number>();
    const warningCodes = new Map<string, number>();
    let total = 0;
    let vatRecoverable = 0;
    let companyCard = 0;
    let withWarnings = 0;

    for (const c of claims) {
      const amount = Number(c.amount);
      total += amount;
      if (c.vatDeductible && Number(c.vatRate) > 0) {
        vatRecoverable += amount - amount / (1 + Number(c.vatRate) / 100);
      }
      if (c.paidWithCompanyCard) companyCard += amount;
      add(byCategory, c.category, CATEGORY_LABEL[c.category as Category], amount);
      add(byEmployee, c.employeeId, `${c.employee.firstName} ${c.employee.lastName}`.trim(), amount);
      if (c.projectId && c.project) add(byProject, c.projectId, c.project.name, amount, c.project.color);
      if (c.vehicleId && c.vehicle) add(byVehicle, c.vehicleId, c.vehicle.matricula, amount);
      const ym = c.date.toISOString().slice(0, 7);
      byMonth.set(ym, round2((byMonth.get(ym) ?? 0) + amount));
      const warns = ((c.policyWarnings as PolicyWarning[] | null) ?? []).filter((w) => w.severity === "warning");
      if (warns.length) withWarnings += 1;
      for (const w of warns) warningCodes.set(w.code, (warningCodes.get(w.code) ?? 0) + 1);
    }

    const months: { month: string; amount: number }[] = [];
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    while (cursor < toEnd) {
      const ym = cursor.toISOString().slice(0, 7);
      months.push({ month: ym, amount: byMonth.get(ym) ?? 0 });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    const sorted = (m: Map<string, any>, keyName: string) =>
      [...m.entries()].map(([k, v]) => ({ [keyName]: k, ...v })).sort((a, b) => b.amount - a.amount);

    return {
      range: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
      totals: {
        approved: round2(total),
        claims: claims.length,
        vatRecoverable: round2(vatRecoverable),
        companyCard: round2(companyCard),
        employees: byEmployee.size,
        withWarnings,
        pendingApproval: round2(Number(pendingClaims._sum.amount ?? 0)),
        pendingApprovalCount: pendingClaims._count,
        pendingReimbursement: round2(Number(approvedReports._sum.reimbursableTotal ?? 0)),
        pendingReimbursementCount: approvedReports._count,
      },
      byCategory: sorted(byCategory, "category"),
      byEmployee: sorted(byEmployee, "employeeId").slice(0, 10),
      byProject: sorted(byProject, "projectId").slice(0, 10),
      byVehicle: sorted(byVehicle, "vehicleId").slice(0, 10),
      byMonth: months,
      warnings: [...warningCodes.entries()].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
    };
  }

  // ─── Notificaciones ───────────────────────────────────────────────────────

  private async notifyApprovers(companyId: string, exceptUserId: string, n: { title: string; body: string; data: any }) {
    const approvers = await this.prisma.userCompany.findMany({
      where: { companyId, role: { in: ["OWNER", "ADMIN", "ACCOUNTANT"] as any }, userId: { not: exceptUserId } },
      select: { userId: true },
    });
    await Promise.all(
      approvers.map((a) => this.notifications.create(companyId, { ...n, userId: a.userId }).catch(() => null)),
    );
  }

  private async notifyEmployee(companyId: string, email: string | null, n: { title: string; body: string; data: any }) {
    if (!email) return;
    const membership = await this.prisma.userCompany.findFirst({
      where: { companyId, user: { email: { equals: email, mode: "insensitive" } } },
      select: { userId: true },
    });
    if (!membership) return;
    await this.notifications.create(companyId, { ...n, userId: membership.userId }).catch(() => null);
  }
}
