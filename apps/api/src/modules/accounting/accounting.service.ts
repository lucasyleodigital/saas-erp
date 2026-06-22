import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

const QUARTER_LABELS = ["T1 (Ene-Mar)", "T2 (Abr-Jun)", "T3 (Jul-Sep)", "T4 (Oct-Dic)"];

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  // ─── P&L (Cuenta de resultados) ───────────────────────────────────────────────

  async getProfitAndLoss(companyId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    // Revenue: from paid/sent invoices
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: start, lte: end },
        status: { in: ["PAID", "SENT", "PARTIAL"] },
      },
      select: { subtotal: true, taxAmount: true, total: true, issueDate: true, status: true },
    });

    const revenue = invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0);
    const vatCollected = invoices.reduce((sum, inv) => sum + Number(inv.taxAmount), 0);

    // Expenses: from MANUAL journal entries (gastos registrados manualmente)
    const expenses = await this.prisma.journalEntry.findMany({
      where: {
        companyId,
        type: { in: ["MANUAL", "ADJUSTMENT"] },
        entryDate: { gte: start, lte: end },
      },
      include: { items: { include: { account: { select: { id: true, code: true, name: true, type: true } } } } },
    });

    const totalExpenses = expenses.reduce((sum, entry) => {
      // Sum debit lines on expense accounts (type EXPENSE, codes 6xx)
      const debits = (entry as any).items
        .filter((item: any) => Number(item.debit) > 0 && item.account?.type === "EXPENSE")
        .reduce((s: number, item: any) => s + Number(item.debit), 0);
      return sum + debits;
    }, 0);

    // Monthly breakdown
    const monthly = Array.from({ length: 12 }, (_, month) => {
      const monthInvoices = invoices.filter(
        (inv) => new Date(inv.issueDate).getMonth() === month
      );
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0);
      const monthExpenses = expenses
        .filter((e) => new Date(e.entryDate).getMonth() === month)
        .reduce((sum, e) => {
          return sum + (e as any).items
            .filter((i: any) => Number(i.debit) > 0 && i.account?.type === "EXPENSE")
            .reduce((s: number, i: any) => s + Number(i.debit), 0);
        }, 0);

      return {
        month: new Date(year, month).toLocaleString("es-ES", { month: "long" }),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      };
    });

    const grossProfit = revenue - totalExpenses;
    const invoiceCount = invoices.length;

    return {
      year,
      revenue,
      vatCollected,
      expenses: totalExpenses,
      grossProfit,
      margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      invoiceCount,
      monthly,
    };
  }

  // ─── IVA Report (Modelo 303) ──────────────────────────────────────────────────

  async getVatReport(companyId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: start, lte: end },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      select: { subtotal: true, taxAmount: true, total: true, issueDate: true, number: true },
    });

    const quarters = [0, 1, 2, 3].map((q) => {
      const qInvoices = invoices.filter((inv) => {
        const m = new Date(inv.issueDate).getMonth();
        return Math.floor(m / 3) === q;
      });

      const base = qInvoices.reduce((s, inv) => s + Number(inv.subtotal), 0);
      const vat = qInvoices.reduce((s, inv) => s + Number(inv.taxAmount), 0);
      const total = qInvoices.reduce((s, inv) => s + Number(inv.total), 0);

      return {
        quarter: q + 1,
        label: QUARTER_LABELS[q],
        invoiceCount: qInvoices.length,
        base,
        vat,
        total,
        vatRate: base > 0 ? (vat / base) * 100 : 0,
      };
    });

    const yearBase = quarters.reduce((s, q) => s + q.base, 0);
    const yearVat = quarters.reduce((s, q) => s + q.vat, 0);

    return {
      year,
      quarters,
      totals: { base: yearBase, vat: yearVat, total: yearBase + yearVat },
    };
  }

  // ─── Modelo 347 (operaciones >3.005€ anuales) ─────────────────────────────────

  async getModelo347(companyId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: start, lte: end },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      include: { client: { select: { id: true, name: true, cifNif: true } } },
    });

    const byClient = new Map<string, { name: string; cifNif: string; total: number; count: number }>();
    for (const inv of invoices) {
      const key = inv.clientId;
      const existing = byClient.get(key) ?? { name: inv.client?.name ?? "", cifNif: inv.client?.cifNif ?? "", total: 0, count: 0 };
      existing.total += Number(inv.total);
      existing.count++;
      byClient.set(key, existing);
    }

    const threshold = 3005.06;
    const declarable = [...byClient.entries()]
      .filter(([, v]) => v.total >= threshold)
      .map(([clientId, v]) => ({
        clientId,
        name: v.name,
        cifNif: v.cifNif,
        totalOperations: Math.round(v.total * 100) / 100,
        invoiceCount: v.count,
      }))
      .sort((a, b) => b.totalOperations - a.totalOperations);

    return {
      year,
      threshold,
      totalDeclarable: declarable.length,
      totalAmount: declarable.reduce((s, d) => s + d.totalOperations, 0),
      entries: declarable,
    };
  }

  // ─── Modelo 111/190 (retenciones IRPF) ──────────────────────────────────────

  async getRetencionesReport(companyId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const invoiceTaxes = await this.prisma.invoiceTax.findMany({
      where: {
        invoice: {
          companyId,
          issueDate: { gte: start, lte: end },
          status: { notIn: ["DRAFT", "CANCELLED"] },
        },
        rate: { lt: 0 },
      },
      include: {
        invoice: { select: { issueDate: true, number: true, clientId: true, client: { select: { name: true, cifNif: true } } } },
      },
    });

    const quarters = [0, 1, 2, 3].map((q) => {
      const qTaxes = invoiceTaxes.filter((t) => {
        const m = new Date(t.invoice.issueDate).getMonth();
        return Math.floor(m / 3) === q;
      });

      const base = qTaxes.reduce((s, t) => s + Number(t.base), 0);
      const retention = qTaxes.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

      return {
        quarter: q + 1,
        label: QUARTER_LABELS[q],
        base: Math.round(base * 100) / 100,
        retention: Math.round(retention * 100) / 100,
        count: qTaxes.length,
      };
    });

    return {
      year,
      quarters,
      totals: {
        base: quarters.reduce((s, q) => s + q.base, 0),
        retention: quarters.reduce((s, q) => s + q.retention, 0),
      },
    };
  }

  // ─── Journal Entries ──────────────────────────────────────────────────────────

  async getJournalEntries(companyId: string, params: any = {}) {
    const { type, search } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 30;
    const where: any = {
      companyId,
      ...(type && { type }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: "insensitive" } },
          { reference: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        include: { items: { include: { account: { select: { id: true, code: true, name: true } } } } },
        orderBy: { entryDate: "desc" },
        skip: (page - 1) * limit,
        take: Number(limit),
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return { data, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  }

  async createJournalEntry(companyId: string, data: any) {
    const { description, reference, entryDate, type, items } = data;

    return this.prisma.journalEntry.create({
      data: {
        companyId,
        description,
        reference,
        entryDate: new Date(entryDate),
        type: type || "MANUAL",
        items: {
          create: items.map((item: any) => ({
            accountId: item.accountId,
            debit: item.debit || 0,
            credit: item.credit || 0,
            description: item.description,
          })),
        },
      },
      include: { items: { include: { account: true } } },
    });
  }

  async deleteJournalEntry(companyId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({ where: { id, companyId } });
    if (!entry) throw new NotFoundException("Asiento no encontrado");
    if (entry.isLocked) throw new NotFoundException("El asiento está bloqueado y no puede eliminarse");
    return this.prisma.journalEntry.delete({ where: { id } });
  }

  // ─── Chart of Accounts ────────────────────────────────────────────────────────

  async getAccounts(companyId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { companyId, isActive: true },
      orderBy: { code: "asc" },
    });

    if (accounts.length === 0) {
      // Seed default Spanish PGC accounts
      await this.seedDefaultAccounts(companyId);
      return this.prisma.account.findMany({ where: { companyId }, orderBy: { code: "asc" } });
    }

    return accounts;
  }

  async createAccount(companyId: string, data: any) {
    return this.prisma.account.create({ data: { ...data, companyId } });
  }

  private async seedDefaultAccounts(companyId: string) {
    const defaultAccounts = [
      // Grupo 1 - Financiación básica
      { code: "100", name: "Capital social", type: "EQUITY" },
      { code: "112", name: "Reserva legal", type: "EQUITY" },
      { code: "129", name: "Resultado del ejercicio", type: "EQUITY" },
      // Grupo 2 - Inmovilizado
      { code: "210", name: "Terrenos y bienes naturales", type: "ASSET" },
      { code: "213", name: "Maquinaria", type: "ASSET" },
      { code: "216", name: "Mobiliario", type: "ASSET" },
      { code: "217", name: "Equipos para procesos de información", type: "ASSET" },
      // Grupo 3 - Existencias
      { code: "300", name: "Mercaderías", type: "ASSET" },
      { code: "310", name: "Materias primas", type: "ASSET" },
      // Grupo 4 - Acreedores y deudores
      { code: "400", name: "Proveedores", type: "LIABILITY" },
      { code: "410", name: "Acreedores varios", type: "LIABILITY" },
      { code: "430", name: "Clientes", type: "ASSET" },
      { code: "440", name: "Deudores varios", type: "ASSET" },
      { code: "460", name: "Anticipos de remuneraciones", type: "ASSET" },
      { code: "470", name: "HP, deudora por IVA", type: "ASSET" },
      { code: "472", name: "HP, IVA soportado", type: "ASSET" },
      { code: "477", name: "HP, IVA repercutido", type: "LIABILITY" },
      { code: "475", name: "HP, acreedora por conceptos fiscales", type: "LIABILITY" },
      // Grupo 5 - Cuentas financieras
      { code: "520", name: "Deudas a corto plazo con entidades de crédito", type: "LIABILITY" },
      { code: "570", name: "Caja, euros", type: "ASSET" },
      { code: "572", name: "Bancos e instituciones de crédito", type: "ASSET" },
      // Grupo 6 - Compras y gastos
      { code: "600", name: "Compras de mercaderías", type: "EXPENSE" },
      { code: "620", name: "Gastos en I+D del ejercicio", type: "EXPENSE" },
      { code: "621", name: "Arrendamientos y cánones", type: "EXPENSE" },
      { code: "622", name: "Reparaciones y conservación", type: "EXPENSE" },
      { code: "623", name: "Servicios de profesionales independientes", type: "EXPENSE" },
      { code: "624", name: "Transportes", type: "EXPENSE" },
      { code: "625", name: "Primas de seguros", type: "EXPENSE" },
      { code: "626", name: "Servicios bancarios y similares", type: "EXPENSE" },
      { code: "627", name: "Publicidad, propaganda y relaciones públicas", type: "EXPENSE" },
      { code: "628", name: "Suministros", type: "EXPENSE" },
      { code: "629", name: "Otros servicios", type: "EXPENSE" },
      { code: "640", name: "Sueldos y salarios", type: "EXPENSE" },
      { code: "642", name: "Seguridad Social a cargo de la empresa", type: "EXPENSE" },
      { code: "662", name: "Intereses de deudas", type: "EXPENSE" },
      { code: "668", name: "Diferencias negativas de cambio", type: "EXPENSE" },
      { code: "690", name: "Pérdidas por deterioro del inmovilizado", type: "EXPENSE" },
      // Grupo 7 - Ventas e ingresos
      { code: "700", name: "Ventas de mercaderías", type: "REVENUE" },
      { code: "705", name: "Prestaciones de servicios", type: "REVENUE" },
      { code: "706", name: "Descuentos sobre ventas por pronto pago", type: "REVENUE" },
      { code: "740", name: "Subvenciones a la explotación", type: "REVENUE" },
      { code: "751", name: "Resultados de operaciones en común", type: "REVENUE" },
      { code: "760", name: "Ingresos de participaciones en instrumentos de patrimonio", type: "REVENUE" },
      { code: "768", name: "Diferencias positivas de cambio", type: "REVENUE" },
    ];

    await this.prisma.account.createMany({
      data: defaultAccounts.map((a) => ({ ...a, companyId })),
      skipDuplicates: true,
    });
  }
}
