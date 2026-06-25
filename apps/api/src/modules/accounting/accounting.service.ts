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

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: start, lte: end },
        status: { in: ["PAID", "SENT", "PARTIAL"] },
      },
      include: { taxes: true },
    });

    const revenue = invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0);

    const ivaTaxes = invoices.flatMap((inv) =>
      (inv.taxes ?? []).filter((t: any) => Number(t.rate) > 0),
    );
    const vatCollected = ivaTaxes.reduce((sum, t: any) => sum + Number(t.amount), 0);

    const irpfTaxes = invoices.flatMap((inv) =>
      (inv.taxes ?? []).filter((t: any) => Number(t.rate) < 0),
    );
    const irpfRetained = irpfTaxes.reduce((sum, t: any) => sum + Math.abs(Number(t.amount)), 0);

    const expenses = await this.prisma.journalEntry.findMany({
      where: {
        companyId,
        type: { in: ["MANUAL", "ADJUSTMENT"] },
        entryDate: { gte: start, lte: end },
      },
      include: { items: { include: { account: { select: { type: true } } } } },
    });

    const totalExpenses = expenses.reduce((sum, entry) => {
      const debits = (entry as any).items
        .filter((item: any) => Number(item.debit) > 0 && item.account?.type === "EXPENSE")
        .reduce((s: number, item: any) => s + Number(item.debit), 0);
      return sum + debits;
    }, 0);

    const monthly = Array.from({ length: 12 }, (_, month) => {
      const monthInvoices = invoices.filter(
        (inv) => new Date(inv.issueDate).getMonth() === month,
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

    const profit = revenue - totalExpenses;

    return {
      year,
      revenue: Math.round(revenue * 100) / 100,
      vatCollected: Math.round(vatCollected * 100) / 100,
      irpfRetained: Math.round(irpfRetained * 100) / 100,
      expenses: Math.round(totalExpenses * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin: revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0,
      invoiceCount: invoices.length,
      monthly,
    };
  }

  // ─── IVA Report (Modelo 303) ──────────────────────────────────────────────────

  async getVatReport(companyId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    // Get all non-draft invoices for the year with their tax records
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: start, lte: end },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      include: { taxes: true },
    });

    const quarters = [0, 1, 2, 3].map((q) => {
      const qInvoices = invoices.filter((inv) => {
        const m = new Date(inv.issueDate).getMonth();
        return Math.floor(m / 3) === q;
      });

      let base = 0;
      let vat = 0;

      for (const inv of qInvoices) {
        const ivaTaxes = (inv.taxes ?? []).filter((t: any) => Number(t.rate) > 0);
        if (ivaTaxes.length > 0) {
          base += ivaTaxes.reduce((s: number, t: any) => s + Number(t.base), 0);
          vat += ivaTaxes.reduce((s: number, t: any) => s + Number(t.amount), 0);
        } else {
          // Fallback: invoices without InvoiceTax records - estimate IVA from stored values
          const invSubtotal = Number(inv.subtotal);
          base += invSubtotal;
          vat += invSubtotal * 0.21;
        }
      }

      return {
        quarter: q + 1,
        label: QUARTER_LABELS[q],
        invoiceCount: qInvoices.length,
        base: Math.round(base * 100) / 100,
        vat: Math.round(vat * 100) / 100,
        total: Math.round((base + vat) * 100) / 100,
        vatRate: base > 0 ? Math.round((vat / base) * 10000) / 100 : 0,
      };
    });

    const yearBase = quarters.reduce((s, q) => s + q.base, 0);
    const yearVat = quarters.reduce((s, q) => s + q.vat, 0);

    return {
      year,
      quarters,
      totals: { base: yearBase, vat: yearVat, total: yearBase + yearVat },
      yearTotal: { base: yearBase, vat: yearVat, total: yearBase + yearVat },
    };
  }

  // ─── Modelo 347 (operaciones >3.005 EUR anuales) ─────────────────────────────

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

    const byClient = new Map<string, { id: string; name: string; cifNif: string; total: number; count: number }>();
    for (const inv of invoices) {
      const key = inv.clientId;
      const existing = byClient.get(key) ?? { id: inv.clientId, name: inv.client?.name ?? "", cifNif: inv.client?.cifNif ?? "", total: 0, count: 0 };
      existing.total += Number(inv.total);
      existing.count++;
      byClient.set(key, existing);
    }

    const threshold = 3005.06;
    const clients = [...byClient.values()]
      .filter((v) => v.total >= threshold)
      .map((v) => ({
        id: v.id,
        name: v.name,
        cifNif: v.cifNif,
        total: Math.round(v.total * 100) / 100,
        invoiceCount: v.count,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      year,
      threshold,
      clients,
      suppliers: [],
      totalDeclarable: clients.length,
      totalAmount: clients.reduce((s, d) => s + d.total, 0),
    };
  }

  // ─── Modelo 111/190 (retenciones IRPF) ──────────────────────────────────────

  async getRetencionesReport(companyId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    // Get invoices with their taxes and client info
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: start, lte: end },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      include: {
        taxes: true,
        client: { select: { id: true, name: true, cifNif: true } },
      },
    });

    const byClient = new Map<string, { clientName: string; cifNif: string; base: number; amount: number; rate: number; count: number }>();

    for (const inv of invoices) {
      const irpfTaxes = (inv.taxes ?? []).filter((t: any) => Number(t.rate) < 0);
      if (irpfTaxes.length === 0) continue;

      const key = inv.clientId;
      const existing = byClient.get(key) ?? {
        clientName: inv.client?.name ?? "",
        cifNif: inv.client?.cifNif ?? "",
        base: 0,
        amount: 0,
        rate: Math.abs(Number(irpfTaxes[0]!.rate)),
        count: 0,
      };
      existing.base += irpfTaxes.reduce((s: number, t: any) => s + Number(t.base), 0);
      existing.amount += irpfTaxes.reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
      existing.count++;
      byClient.set(key, existing);
    }

    const retentions = [...byClient.values()]
      .map((v) => ({
        clientName: v.clientName,
        cifNif: v.cifNif,
        base: Math.round(v.base * 100) / 100,
        amount: Math.round(v.amount * 100) / 100,
        rate: v.rate,
        count: v.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    const quarters = [0, 1, 2, 3].map((q) => {
      const qInvoices = invoices.filter((inv) => Math.floor(new Date(inv.issueDate).getMonth() / 3) === q);
      let base = 0;
      let retention = 0;
      let count = 0;
      for (const inv of qInvoices) {
        const irpfTaxes = (inv.taxes ?? []).filter((t: any) => Number(t.rate) < 0);
        if (irpfTaxes.length > 0) {
          base += irpfTaxes.reduce((s: number, t: any) => s + Number(t.base), 0);
          retention += irpfTaxes.reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
          count++;
        }
      }
      return { quarter: q + 1, label: QUARTER_LABELS[q], base: Math.round(base * 100) / 100, retention: Math.round(retention * 100) / 100, count };
    });

    return {
      year,
      retentions,
      quarters,
      total: {
        base: retentions.reduce((s, r) => s + r.base, 0),
        amount: retentions.reduce((s, r) => s + r.amount, 0),
      },
    };
  }

  // ─── Libro de facturas emitidas/recibidas (AEAT) ─────────────────────────────

  async getLibroFacturas(companyId: string, year: number, _type?: "emitidas" | "recibidas") {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const invoices = await this.prisma.invoice.findMany({
      where: { companyId, issueDate: { gte: start, lte: end }, status: { notIn: ["DRAFT"] } },
      include: {
        client: { select: { name: true, cifNif: true } },
        taxes: true,
      },
      orderBy: { issueDate: "asc" },
    });

    const emitidas = invoices.map((inv) => {
      const ivaTaxes = (inv.taxes ?? []).filter((t: any) => Number(t.rate) > 0);
      const irpfTaxes = (inv.taxes ?? []).filter((t: any) => Number(t.rate) < 0);
      return {
        id: inv.id,
        number: inv.number,
        issueDate: inv.issueDate.toISOString().slice(0, 10),
        clientName: inv.client?.name ?? "",
        clientCif: inv.client?.cifNif ?? "",
        subtotal: Number(inv.subtotal),
        taxAmount: ivaTaxes.reduce((s: number, t: any) => s + Number(t.amount), 0),
        irpfAmount: irpfTaxes.reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0),
        total: Number(inv.total),
        status: inv.status,
      };
    });

    const expenses = await this.prisma.journalEntry.findMany({
      where: { companyId, type: { in: ["MANUAL", "ADJUSTMENT"] }, entryDate: { gte: start, lte: end } },
      include: { items: { include: { account: { select: { code: true, name: true, type: true } } } } },
      orderBy: { entryDate: "asc" },
    });

    const recibidas = expenses.map((e) => {
      const debitTotal = (e as any).items
        .filter((i: any) => Number(i.debit) > 0)
        .reduce((s: number, i: any) => s + Number(i.debit), 0);
      return {
        id: e.id,
        number: e.reference ?? e.id.slice(0, 8),
        date: e.entryDate.toISOString().slice(0, 10),
        supplierName: e.description,
        subtotal: debitTotal,
        taxAmount: 0,
        total: debitTotal,
      };
    });

    return { year, emitidas, recibidas };
  }

  // ─── Modelo 130 (pago fraccionado IRPF — autonomos) ──────────────────────────

  async getModelo130(companyId: string, year: number, _quarter?: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: start, lte: end },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      include: { taxes: true },
    });

    const expenses = await this.prisma.journalEntry.findMany({
      where: {
        companyId,
        type: { in: ["MANUAL", "ADJUSTMENT"] },
        entryDate: { gte: start, lte: end },
      },
      include: { items: { include: { account: { select: { type: true } } } } },
    });

    const quarters = [0, 1, 2, 3].map((q) => {
      const qInvoices = invoices.filter((inv) => Math.floor(new Date(inv.issueDate).getMonth() / 3) === q);
      const qExpenses = expenses.filter((e) => Math.floor(new Date(e.entryDate).getMonth() / 3) === q);

      const revenue = qInvoices.reduce((s, inv) => s + Number(inv.subtotal), 0);
      const expenseTotal = qExpenses.reduce((sum, entry) => {
        return sum + (entry as any).items
          .filter((item: any) => Number(item.debit) > 0 && item.account?.type === "EXPENSE")
          .reduce((s: number, item: any) => s + Number(item.debit), 0);
      }, 0);
      const netIncome = revenue - expenseTotal;
      const irpfAmount = Math.max(0, netIncome * 0.20);

      const retenciones = qInvoices.flatMap((inv) =>
        (inv.taxes ?? []).filter((t: any) => Number(t.rate) < 0),
      );
      const retencionesAmount = retenciones.reduce((s, t: any) => s + Math.abs(Number(t.amount)), 0);

      return {
        quarter: q + 1,
        label: QUARTER_LABELS[q],
        revenue: Math.round(revenue * 100) / 100,
        expenses: Math.round(expenseTotal * 100) / 100,
        netIncome: Math.round(netIncome * 100) / 100,
        irpfRate: 20,
        irpfAmount: Math.round(irpfAmount * 100) / 100,
        retenciones: Math.round(retencionesAmount * 100) / 100,
        previousPayments: 0,
        toPay: Math.round(Math.max(0, irpfAmount - retencionesAmount) * 100) / 100,
      };
    });

    // Calculate cumulative previous payments
    for (let i = 1; i < 4; i++) {
      quarters[i]!.previousPayments = quarters.slice(0, i).reduce((s, q) => s + q.toPay, 0);
      const ytdNet = quarters.slice(0, i + 1).reduce((s, q) => s + q.netIncome, 0);
      const ytdIrpf = Math.max(0, ytdNet * 0.20);
      const ytdRetenciones = quarters.slice(0, i + 1).reduce((s, q) => s + q.retenciones, 0);
      quarters[i]!.toPay = Math.round(Math.max(0, ytdIrpf - ytdRetenciones - quarters[i]!.previousPayments) * 100) / 100;
    }

    return {
      year,
      quarters,
      yearTotal: {
        revenue: quarters.reduce((s, q) => s + q.revenue, 0),
        expenses: quarters.reduce((s, q) => s + q.expenses, 0),
        netIncome: quarters.reduce((s, q) => s + q.netIncome, 0),
        toPay: quarters.reduce((s, q) => s + q.toPay, 0),
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
    const { description, reference, entryDate, date, type, items } = data;

    return this.prisma.journalEntry.create({
      data: {
        companyId,
        description,
        reference,
        entryDate: new Date(entryDate || date),
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
    if (entry.isLocked) throw new NotFoundException("El asiento esta bloqueado");
    return this.prisma.journalEntry.delete({ where: { id } });
  }

  // ─── Chart of Accounts ────────────────────────────────────────────────────────

  async getAccounts(companyId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { companyId, isActive: true },
      orderBy: { code: "asc" },
    });

    if (accounts.length === 0) {
      await this.seedDefaultAccounts(companyId);
      return this.prisma.account.findMany({ where: { companyId }, orderBy: { code: "asc" } });
    }

    return accounts;
  }

  async createAccount(companyId: string, data: any) {
    return this.prisma.account.create({ data: { ...data, companyId } });
  }

  async updateAccount(companyId: string, id: string, data: any) {
    const account = await this.prisma.account.findFirst({ where: { id, companyId } });
    if (!account) throw new NotFoundException("Cuenta no encontrada");
    return this.prisma.account.update({ where: { id }, data });
  }

  async deleteAccount(companyId: string, id: string) {
    const account = await this.prisma.account.findFirst({ where: { id, companyId } });
    if (!account) throw new NotFoundException("Cuenta no encontrada");
    const hasEntries = await this.prisma.journalItem.count({ where: { accountId: id } });
    if (hasEntries > 0) throw new NotFoundException("La cuenta tiene asientos y no se puede eliminar");
    return this.prisma.account.delete({ where: { id } });
  }

  async backfillInvoiceTaxes(companyId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      include: { taxes: true },
    });

    let ivaTax = await this.prisma.tax.findFirst({ where: { companyId, rate: 21 } });
    if (!ivaTax) {
      ivaTax = await this.prisma.tax.create({
        data: { companyId, name: "IVA 21%", rate: 21, isDefault: true },
      });
    }

    let fixed = 0;
    for (const inv of invoices) {
      if (inv.taxes && inv.taxes.length > 0) continue;

      const subtotal = Number(inv.subtotal);
      if (subtotal <= 0) continue;

      const ivaAmount = subtotal * 0.21;

      await this.prisma.invoiceTax.create({
        data: {
          invoiceId: inv.id,
          taxId: ivaTax.id,
          rate: 21,
          base: subtotal,
          amount: ivaAmount,
        },
      });

      const correctTotal = subtotal + ivaAmount;
      if (Math.abs(Number(inv.total) - correctTotal) > 0.01 || Math.abs(Number(inv.taxAmount) - ivaAmount) > 0.01) {
        await this.prisma.invoice.update({
          where: { id: inv.id },
          data: { taxAmount: ivaAmount, total: correctTotal },
        });
      }

      fixed++;
    }

    return { message: `${fixed} facturas corregidas con registros de IVA`, fixed, total: invoices.length };
  }

  private async seedDefaultAccounts(companyId: string) {
    const defaultAccounts = [
      { code: "100", name: "Capital social", type: "EQUITY" },
      { code: "112", name: "Reserva legal", type: "EQUITY" },
      { code: "129", name: "Resultado del ejercicio", type: "EQUITY" },
      { code: "210", name: "Terrenos y bienes naturales", type: "ASSET" },
      { code: "213", name: "Maquinaria", type: "ASSET" },
      { code: "216", name: "Mobiliario", type: "ASSET" },
      { code: "217", name: "Equipos para procesos de informacion", type: "ASSET" },
      { code: "300", name: "Mercaderias", type: "ASSET" },
      { code: "310", name: "Materias primas", type: "ASSET" },
      { code: "400", name: "Proveedores", type: "LIABILITY" },
      { code: "410", name: "Acreedores varios", type: "LIABILITY" },
      { code: "430", name: "Clientes", type: "ASSET" },
      { code: "440", name: "Deudores varios", type: "ASSET" },
      { code: "460", name: "Anticipos de remuneraciones", type: "ASSET" },
      { code: "470", name: "HP, deudora por IVA", type: "ASSET" },
      { code: "472", name: "HP, IVA soportado", type: "ASSET" },
      { code: "473", name: "HP, retenciones y pagos a cuenta", type: "ASSET" },
      { code: "475", name: "HP, acreedora por conceptos fiscales", type: "LIABILITY" },
      { code: "476", name: "Organismos SS acreedores", type: "LIABILITY" },
      { code: "477", name: "HP, IVA repercutido", type: "LIABILITY" },
      { code: "520", name: "Deudas a corto plazo con entidades de credito", type: "LIABILITY" },
      { code: "570", name: "Caja, euros", type: "ASSET" },
      { code: "572", name: "Bancos e instituciones de credito", type: "ASSET" },
      { code: "600", name: "Compras de mercaderias", type: "EXPENSE" },
      { code: "620", name: "Gastos en I+D del ejercicio", type: "EXPENSE" },
      { code: "621", name: "Arrendamientos y canones", type: "EXPENSE" },
      { code: "622", name: "Reparaciones y conservacion", type: "EXPENSE" },
      { code: "623", name: "Servicios de profesionales independientes", type: "EXPENSE" },
      { code: "624", name: "Transportes", type: "EXPENSE" },
      { code: "625", name: "Primas de seguros", type: "EXPENSE" },
      { code: "626", name: "Servicios bancarios y similares", type: "EXPENSE" },
      { code: "627", name: "Publicidad, propaganda y relaciones publicas", type: "EXPENSE" },
      { code: "628", name: "Suministros", type: "EXPENSE" },
      { code: "629", name: "Otros servicios", type: "EXPENSE" },
      { code: "631", name: "Otros tributos", type: "EXPENSE" },
      { code: "640", name: "Sueldos y salarios", type: "EXPENSE" },
      { code: "642", name: "Seguridad Social a cargo de la empresa", type: "EXPENSE" },
      { code: "649", name: "Otros gastos sociales", type: "EXPENSE" },
      { code: "662", name: "Intereses de deudas", type: "EXPENSE" },
      { code: "668", name: "Diferencias negativas de cambio", type: "EXPENSE" },
      { code: "680", name: "Amortizacion del inmovilizado intangible", type: "EXPENSE" },
      { code: "681", name: "Amortizacion del inmovilizado material", type: "EXPENSE" },
      { code: "700", name: "Ventas de mercaderias", type: "REVENUE" },
      { code: "705", name: "Prestaciones de servicios", type: "REVENUE" },
      { code: "706", name: "Descuentos sobre ventas por pronto pago", type: "REVENUE" },
      { code: "740", name: "Subvenciones a la explotacion", type: "REVENUE" },
      { code: "760", name: "Ingresos de participaciones", type: "REVENUE" },
      { code: "768", name: "Diferencias positivas de cambio", type: "REVENUE" },
      { code: "769", name: "Otros ingresos financieros", type: "REVENUE" },
    ];

    await this.prisma.account.createMany({
      data: defaultAccounts.map((a) => ({ ...a, companyId })),
      skipDuplicates: true,
    });
  }
}
