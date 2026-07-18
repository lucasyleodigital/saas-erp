import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { AccountingService } from "../accounting/accounting.service";

export interface QuarterRange {
  year: number;
  quarter: number;
  from: Date;
  to: Date;
  deadline: Date;
}

function quarterRange(year: number, q: number): QuarterRange {
  const startMonth = (q - 1) * 3;
  const from = new Date(year, startMonth, 1);
  const to = new Date(year, startMonth + 3, 0, 23, 59, 59);
  const deadlineMonth = startMonth + 3;
  const deadline = new Date(year, deadlineMonth, 20);
  return { year, quarter: q, from, to, deadline };
}

function currentQuarter(): QuarterRange {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return quarterRange(now.getFullYear(), q);
}

@Injectable()
export class FiscalService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private accounting: AccountingService,
  ) {}

  // ── Modelo 303 ─────────────────────────────────────────────
  async getM303(companyId: string, year: number, quarter: number) {
    const range = quarterRange(year, quarter);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: range.from, lte: range.to },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
    });

    const invoiceIds = invoices.map((i) => i.id);

    // IVA repercutido — leer InvoiceTax con rate > 0 (excluye IRPF que es negativo)
    const ivaTaxes = invoiceIds.length
      ? await this.prisma.invoiceTax.findMany({
          where: { invoiceId: { in: invoiceIds }, rate: { gt: 0 } },
        })
      : [];

    const expenses = await this.prisma.expense.findMany({
      where: {
        companyId,
        date: { gte: range.from, lte: range.to },
        isDeductible: true,
      },
    });

    const baseRepercutida = invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0);

    // Si hay registros InvoiceTax, usarlos; si no, estimar IVA al 21% sobre subtotal
    const ivaRepercutido = ivaTaxes.length
      ? ivaTaxes.reduce((s, t) => s + Number(t.amount), 0)
      : invoices.reduce((s, inv) => s + Number(inv.subtotal) * 0.21, 0);

    // IVA soportado (gastos deducibles)
    const ivaSoportado = expenses.reduce((s, e) => s + Number(e.vatAmount), 0);
    const baseSoportada = expenses.reduce((s, e) => s + Number(e.subtotal), 0);

    const resultado = ivaRepercutido - ivaSoportado;

    return {
      period: { year, quarter, from: range.from, to: range.to, deadline: range.deadline },
      repercutido: {
        base: +baseRepercutida.toFixed(2),
        cuota: +ivaRepercutido.toFixed(2),
        invoiceCount: invoices.length,
      },
      soportado: {
        base: +baseSoportada.toFixed(2),
        cuota: +ivaSoportado.toFixed(2),
        expenseCount: expenses.length,
      },
      resultado: +resultado.toFixed(2),
      casillas: {
        c01: +baseRepercutida.toFixed(2),
        c03: +ivaRepercutido.toFixed(2),
        c29: +ivaSoportado.toFixed(2),
        c46: +resultado.toFixed(2),
      },
    };
  }

  // ── Modelo 130 ─────────────────────────────────────────────
  async getM130(companyId: string, year: number, quarter: number) {
    const range = quarterRange(year, quarter);
    const yearStart = new Date(year, 0, 1);

    // Acumulado del año hasta fin del trimestre
    const invoicesYTD = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: yearStart, lte: range.to },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      include: { taxes: true },
    });

    const expensesYTD = await this.prisma.expense.findMany({
      where: {
        companyId,
        date: { gte: yearStart, lte: range.to },
        isDeductible: true,
      },
    });

    const invoiceIdsYTD = invoicesYTD.map((i) => i.id);
    const ingresosYTD = invoicesYTD.reduce((s, i) => s + Number(i.subtotal), 0);
    const gastosYTD = expensesYTD.reduce((s, e) => s + Number(e.subtotal), 0);
    const rendimientoNeto = Math.max(0, ingresosYTD - gastosYTD);
    const pagoPrevio = rendimientoNeto * 0.2;

    // IRPF retenido por clientes — leer InvoiceTax con rate < 0 (retenciones)
    const irpfTaxes = invoiceIdsYTD.length
      ? await this.prisma.invoiceTax.findMany({
          where: { invoiceId: { in: invoiceIdsYTD }, rate: { lt: 0 } },
        })
      : [];

    // Si hay registros InvoiceTax, usarlos; si no, estimar IRPF al 15%
    const retencionesYTD = irpfTaxes.length
      ? irpfTaxes.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
      : invoicesYTD.reduce((s, inv) => s + Number(inv.subtotal) * 0.15, 0);

    // Pagos anteriores ya ingresados (trimestres previos del año)
    const periodosPrevios = await this.prisma.fiscalPeriod.findMany({
      where: { companyId, year, quarter: { lt: quarter }, model130Filed: true },
    });
    const pagosPrevios = periodosPrevios.reduce((s, p) => s + Number(p.model130Amount ?? 0), 0);

    const aIngresar = Math.max(0, pagoPrevio - retencionesYTD - pagosPrevios);

    return {
      period: { year, quarter, from: range.from, to: range.to, deadline: range.deadline },
      ingresosYTD: +ingresosYTD.toFixed(2),
      gastosYTD: +gastosYTD.toFixed(2),
      rendimientoNeto: +rendimientoNeto.toFixed(2),
      pagoPrevio: +pagoPrevio.toFixed(2),
      retencionesYTD: +retencionesYTD.toFixed(2),
      pagosPrevios: +pagosPrevios.toFixed(2),
      aIngresar: +aIngresar.toFixed(2),
      casillas: {
        c01: +ingresosYTD.toFixed(2),
        c02: +gastosYTD.toFixed(2),
        c03: +rendimientoNeto.toFixed(2),
        c05: +pagoPrevio.toFixed(2),
        c14: +retencionesYTD.toFixed(2),
        c15: +pagosPrevios.toFixed(2),
        c16: +aIngresar.toFixed(2),
      },
    };
  }

  // ── Calendario fiscal ──────────────────────────────────────
  getCalendar(year: number) {
    const deadlines = [];
    for (let q = 1; q <= 4; q++) {
      const range = quarterRange(year, q);
      deadlines.push(
        { model: "303", year, quarter: q, deadline: range.deadline, label: `Modelo 303 – ${q}T ${year}` },
        { model: "130", year, quarter: q, deadline: range.deadline, label: `Modelo 130 – ${q}T ${year}` },
        { model: "111", year, quarter: q, deadline: range.deadline, label: `Modelo 111 – ${q}T ${year}` },
      );
    }
    // Anuales
    deadlines.push(
      { model: "390", year, quarter: null, deadline: new Date(year + 1, 0, 30), label: `Modelo 390 – Resumen IVA ${year}` },
      { model: "190", year, quarter: null, deadline: new Date(year + 1, 0, 31), label: `Modelo 190 – Resumen IRPF ${year}` },
      { model: "100", year, quarter: null, deadline: new Date(year + 1, 5, 30), label: `Renta (Modelo 100) – ${year}` },
    );
    const now = new Date();
    return deadlines
      .map((d) => ({
        ...d,
        daysLeft: Math.ceil((d.deadline.getTime() - now.getTime()) / 86400000),
        overdue: d.deadline < now,
      }))
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }

  // ── Modelo 111 (Retenciones IRPF — nóminas y profesionales) ─
  async getM111(companyId: string, year: number, quarter: number) {
    const range = quarterRange(year, quarter);

    // Retenciones de IRPF soportadas en facturas de proveedores/gastos
    // Campo withholdingRate / withholdingAmount en expenses (si existe)
    const expenses = await this.prisma.expense.findMany({
      where: {
        companyId,
        date: { gte: range.from, lte: range.to },
      },
    });

    // Retenciones en facturas emitidas (IRPF que nos retienen los clientes)
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: range.from, lte: range.to },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      include: { taxes: true },
    });

    // IRPF retenido en facturas de compra (gastos con retención): usamos campo withholdingAmount si existe
    const retencionesGastos = expenses.reduce((s, e) => {
      const w = (e as any).withholdingAmount;
      return s + (w ? Math.abs(Number(w)) : 0);
    }, 0);
    const baseGastos = expenses.reduce((s, e) => {
      const w = (e as any).withholdingAmount;
      return s + (w ? Number(e.subtotal) : 0);
    }, 0);

    // IRPF retenido en facturas emitidas (clientes nos retienen): taxes con rate < 0
    const irpfTaxesFacturado = invoices.flatMap((i) =>
      i.taxes.filter((t) => Number(t.rate) < 0),
    );
    const retencionesClientes = irpfTaxesFacturado.reduce(
      (s, t) => s + Math.abs(Number(t.amount)),
      0,
    );
    const baseClientes = invoices
      .filter((i) => i.taxes.some((t) => Number(t.rate) < 0))
      .reduce((s, i) => s + Number(i.subtotal), 0);

    // Total a ingresar = retenciones practicadas a terceros (gastos profesionales)
    // Las retenciones que NOS practican los clientes no se ingresan en M111 (esas son del cliente)
    const totalRetenciones = retencionesGastos;
    const totalBase = baseGastos;
    const tipoMedio = totalBase > 0 ? +((totalRetenciones / totalBase) * 100).toFixed(2) : 0;

    return {
      period: { year, quarter, from: range.from, to: range.to, deadline: range.deadline },
      // Retenciones practicadas a proveedores/profesionales (lo que INGRESAMOS a Hacienda)
      retencionesAProveedores: {
        base: +totalBase.toFixed(2),
        retenciones: +totalRetenciones.toFixed(2),
        tipoMedio,
      },
      // Info adicional: retenciones que NOS practican los clientes
      retencionesDeClientes: {
        base: +baseClientes.toFixed(2),
        retenciones: +retencionesClientes.toFixed(2),
      },
      aIngresar: +totalRetenciones.toFixed(2),
      casillas: {
        c01: +totalBase.toFixed(2),       // Perceptores
        c03: +totalBase.toFixed(2),       // Base de retención
        c04: +tipoMedio.toFixed(2),       // Tipo medio
        c05: +totalRetenciones.toFixed(2), // Retenciones e ingresos a cuenta
        c06: +totalRetenciones.toFixed(2), // Total a ingresar/devolver
      },
      nota: retencionesGastos === 0
        ? "No se han detectado gastos con retención IRPF este trimestre. Si pagas facturas a profesionales autónomos con retención, asegúrate de registrarlas con el campo 'retención' en el gasto."
        : null,
    };
  }

  // ── Modelo 202 (Impuesto de Sociedades — pago fraccionado) ─
  async getM202(companyId: string, year: number, period: number) {
    // Periods: 1=abril (1T), 2=octubre (3T), 3=diciembre (4T parcial)
    const periodDeadlines: Record<number, Date> = {
      1: new Date(year, 3, 20),   // 20 abril
      2: new Date(year, 9, 20),   // 20 octubre
      3: new Date(year, 11, 20),  // 20 diciembre
    };
    const deadline = periodDeadlines[period] ?? new Date(year, 3, 20);

    // Para IS: base = beneficio neto estimado del año en curso
    // Método simplificado: 18% del resultado contable del último ejercicio cerrado
    // O método real: 17-24% sobre resultado del periodo en curso
    const from = new Date(year, 0, 1);
    const to = new Date();

    const invoices = await this.prisma.invoice.findMany({
      where: { companyId, issueDate: { gte: from, lte: to }, status: { notIn: ["DRAFT", "CANCELLED"] } },
    });
    const expenses = await this.prisma.expense.findMany({
      where: { companyId, date: { gte: from, lte: to }, isDeductible: true },
    });

    const ingresos = invoices.reduce((s, i) => s + Number(i.subtotal), 0);
    const gastos = expenses.reduce((s, e) => s + Number(e.subtotal), 0);
    const resultadoContable = Math.max(0, ingresos - gastos);
    const tipoGravamen = 0.25; // 25% tipo general pymes; 23% si facturación < 1M€
    const cuotaIntegra = resultadoContable * tipoGravamen;
    const pagoFraccionado = +(cuotaIntegra * 0.18).toFixed(2); // 18% de la cuota íntegra

    return {
      period,
      deadline,
      daysLeft: Math.ceil((deadline.getTime() - Date.now()) / 86400000),
      ingresos: +ingresos.toFixed(2),
      gastos: +gastos.toFixed(2),
      resultadoContable: +resultadoContable.toFixed(2),
      tipoGravamen: tipoGravamen * 100,
      cuotaIntegra: +cuotaIntegra.toFixed(2),
      pagoFraccionado,
      casillas: {
        c01: +ingresos.toFixed(2),
        c02: +gastos.toFixed(2),
        c12: +resultadoContable.toFixed(2),
        c13: +(resultadoContable * tipoGravamen).toFixed(2),
        c14: +pagoFraccionado.toFixed(2),
      },
      nota: "Cálculo orientativo. El tipo puede ser 23% si facturación anual < 1M€. Consulta con gestor para deducciones específicas.",
    };
  }

  // ── Gastos ─────────────────────────────────────────────────
  async getExpenses(companyId: string, params: any) {
    const { year, quarter, page = 1, limit = 50 } = params;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = { companyId };
    if (year && quarter) {
      const range = quarterRange(Number(year), Number(quarter));
      where.date = { gte: range.from, lte: range.to };
    } else if (year) {
      where.date = { gte: new Date(Number(year), 0, 1), lte: new Date(Number(year), 11, 31, 23, 59, 59) };
    }

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({ where, skip, take: Number(limit), orderBy: { date: "desc" } }),
      this.prisma.expense.count({ where }),
    ]);
    return { data, total };
  }

  async createExpense(companyId: string, data: any) {
    const subtotal = Number(data.subtotal);
    const vatRate = Number(data.vatRate ?? 21);
    const vatAmount = +(subtotal * vatRate / 100).toFixed(2);
    const total = +(subtotal + vatAmount).toFixed(2);

    const withholdingRate = data.withholdingRate != null ? Number(data.withholdingRate) : null;
    const withholdingAmount = withholdingRate != null ? +(subtotal * withholdingRate / 100).toFixed(2) : null;

    const expense = await this.prisma.expense.create({
      data: {
        companyId,
        date: new Date(data.date),
        description: data.description,
        supplier: data.supplier || null,
        supplierNif: data.supplierNif || null,
        invoiceRef: data.invoiceRef || null,
        subtotal,
        vatRate,
        vatAmount,
        total,
        category: data.category || "OTROS",
        isDeductible: data.isDeductible !== false,
        attachmentUrl: data.attachmentUrl || null,
        withholdingRate,
        withholdingAmount,
      },
    });

    // Crear asiento contable automáticamente
    this.accounting.createExpenseJournalEntry(companyId, {
      id: expense.id, date: expense.date, description: expense.description,
      supplier: expense.supplier, subtotal, vatRate, vatAmount, total,
      category: expense.category,
      withholdingRate, withholdingAmount,
    }).catch((err) => console.error("[Accounting] Failed to create journal entry:", err?.message));

    return expense;
  }

  async analyzeExpense(file: Express.Multer.File): Promise<{
    attachmentUrl: string | null;
    extracted: {
      date?: string; description?: string; supplier?: string;
      supplierNif?: string; invoiceRef?: string; subtotal?: number;
      vatRate?: number; category?: string;
    };
  }> {
    const claudeKey = this.config.get<string>("CLAUDE_API_KEY");
    const supabaseUrl = this.config.get<string>("SUPABASE_URL");
    const supabaseKey = this.config.get<string>("SUPABASE_SERVICE_KEY");

    // Upload to Supabase Storage (if configured)
    let attachmentUrl: string | null = null;
    if (supabaseUrl && supabaseKey) {
      const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/expense-attachments/${fileName}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": file.mimetype,
            "x-upsert": "true",
          },
          body: file.buffer as unknown as BodyInit,
        },
      );
      if (uploadRes.ok) {
        attachmentUrl = `${supabaseUrl}/storage/v1/object/public/expense-attachments/${fileName}`;
      } else {
        console.warn("[analyzeExpense] Storage upload failed:", await uploadRes.text());
      }
    }

    // OCR extraction with Claude (if configured)
    let extracted: Record<string, any> = {};
    if (claudeKey) {
      const isImage = file.mimetype.startsWith("image/");
      const isPdf = file.mimetype === "application/pdf";

      if (isImage || isPdf) {
        const mediaType = isPdf ? "application/pdf" : (file.mimetype as "image/jpeg" | "image/png" | "image/webp" | "image/gif");
        const base64 = file.buffer.toString("base64");

        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": claudeKey,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "pdfs-2024-09-25",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 512,
            messages: [{
              role: "user",
              content: [
                {
                  type: isPdf ? "document" : "image",
                  source: { type: "base64", media_type: mediaType, data: base64 },
                },
                {
                  type: "text",
                  text: `Extrae los datos de esta factura o ticket y responde SOLO con JSON válido, sin explicaciones:
{
  "date": "YYYY-MM-DD",
  "supplier": "nombre del proveedor",
  "supplierNif": "NIF/CIF del proveedor si aparece",
  "invoiceRef": "número de factura si aparece",
  "description": "descripción breve del gasto",
  "subtotal": número sin IVA (decimal con punto),
  "vatRate": tipo de IVA en % (0, 4, 10 o 21),
  "category": una de: SERVICIOS, SOFTWARE, MARKETING, OFICINA, TRANSPORTE, FORMACION, OTROS
}
Si no puedes leer algún campo, omítelo del JSON.`,
                },
              ],
            }],
          }),
        });

        if (claudeRes.ok) {
          const claudeData = await claudeRes.json() as any;
          const text = claudeData.content?.[0]?.text ?? "";
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
          } catch {
            console.warn("[analyzeExpense] Could not parse Claude response:", text);
          }
        } else {
          console.warn("[analyzeExpense] Claude API error:", await claudeRes.text());
        }
      }
    }

    return { attachmentUrl, extracted };
  }

  async updateExpense(companyId: string, id: string, data: any) {
    const existing = await this.prisma.expense.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Gasto no encontrado");
    const subtotal = data.subtotal !== undefined ? Number(data.subtotal) : Number(existing.subtotal);
    const vatRate  = data.vatRate  !== undefined ? Number(data.vatRate)  : Number(existing.vatRate);
    const vatAmount = +(subtotal * vatRate / 100).toFixed(2);
    const total     = +(subtotal + vatAmount).toFixed(2);
    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(data.date        && { date:        new Date(data.date) }),
        ...(data.description && { description: data.description }),
        ...(data.supplier    !== undefined && { supplier:    data.supplier    || null }),
        ...(data.supplierNif !== undefined && { supplierNif: data.supplierNif || null }),
        ...(data.invoiceRef  !== undefined && { invoiceRef:  data.invoiceRef  || null }),
        ...(data.category    && { category: data.category }),
        subtotal, vatRate, vatAmount, total,
        isDeductible: data.isDeductible !== false,
        ...(data.withholdingRate != null
          ? {
              withholdingRate: Number(data.withholdingRate),
              withholdingAmount: +(subtotal * Number(data.withholdingRate) / 100).toFixed(2),
            }
          : {}),
      },
    });

    // Regenerar asiento contable (borrar el anterior y crear uno nuevo)
    this.accounting.deleteExpenseJournalEntry(companyId, id)
      .then(() => this.accounting.createExpenseJournalEntry(companyId, {
        id: updated.id, date: updated.date, description: updated.description,
        supplier: updated.supplier, subtotal, vatRate, vatAmount, total,
        category: updated.category,
        withholdingRate:  (updated as any).withholdingRate  != null ? Number((updated as any).withholdingRate)  : null,
        withholdingAmount:(updated as any).withholdingAmount != null ? Number((updated as any).withholdingAmount) : null,
      }))
      .catch((err) => console.error("[Accounting] Failed to update journal entry:", err?.message));

    return updated;
  }

  async deleteExpense(companyId: string, id: string) {
    // Borrar asiento contable asociado primero
    await this.accounting.deleteExpenseJournalEntry(companyId, id).catch(() => {});
    await this.prisma.expense.deleteMany({ where: { id, companyId } });
    return { deleted: true };
  }

  // ── Marcar modelo como presentado ─────────────────────────
  async markFiled(companyId: string, year: number, quarter: number, body: any) {
    return this.prisma.fiscalPeriod.upsert({
      where: { companyId_year_quarter: { companyId, year, quarter } },
      create: {
        companyId, year, quarter,
        model303Filed: body.model303Filed ?? false,
        model130Filed: body.model130Filed ?? false,
        model111Filed: body.model111Filed ?? false,
        model303Amount: body.model303Amount ?? null,
        model130Amount: body.model130Amount ?? null,
        model111Amount: body.model111Amount ?? null,
        filedAt: body.filedAt ? new Date(body.filedAt) : new Date(),
        notes: body.notes ?? null,
      },
      update: {
        model303Filed: body.model303Filed ?? undefined,
        model130Filed: body.model130Filed ?? undefined,
        model111Filed: body.model111Filed ?? undefined,
        model303Amount: body.model303Amount ?? undefined,
        model130Amount: body.model130Amount ?? undefined,
        model111Amount: body.model111Amount ?? undefined,
        filedAt: body.filedAt ? new Date(body.filedAt) : new Date(),
        notes: body.notes ?? undefined,
      },
    });
  }

  async getFiscalPeriods(companyId: string, year: number) {
    return this.prisma.fiscalPeriod.findMany({
      where: { companyId, year },
      orderBy: { quarter: "asc" },
    });
  }

  // ── Resumen anual ─────────────────────────────────────────
  async getAnnualSummary(companyId: string, year: number) {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59);

    const [invoices, expenses] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { companyId, issueDate: { gte: from, lte: to }, status: { notIn: ["DRAFT", "CANCELLED"] } },
        include: { taxes: true },
      }),
      this.prisma.expense.findMany({
        where: { companyId, date: { gte: from, lte: to }, isDeductible: true },
      }),
    ]);

    const ingresos = invoices.reduce((s, i) => s + Number(i.subtotal), 0);
    const gastos = expenses.reduce((s, e) => s + Number(e.subtotal), 0);
    const ivaRepercutido = invoices.reduce((s, inv) => {
      return s + inv.taxes.filter((t) => Number(t.rate) > 0 && Number(t.rate) !== 15)
        .reduce((ss, t) => ss + Number(t.amount), 0);
    }, 0);
    const ivaSoportado = expenses.reduce((s, e) => s + Number(e.vatAmount), 0);
    const retenciones = invoices.reduce((s, inv) => {
      return s + inv.taxes.filter((t) => Number(t.amount) < 0)
        .reduce((ss, t) => ss + Math.abs(Number(t.amount)), 0);
    }, 0);

    return {
      year,
      ingresos: +ingresos.toFixed(2),
      gastos: +gastos.toFixed(2),
      rendimientoNeto: +(ingresos - gastos).toFixed(2),
      ivaRepercutido: +ivaRepercutido.toFixed(2),
      ivaSoportado: +ivaSoportado.toFixed(2),
      ivaResultado: +(ivaRepercutido - ivaSoportado).toFixed(2),
      retencionesTotales: +retenciones.toFixed(2),
      invoiceCount: invoices.length,
      expenseCount: expenses.length,
    };
  }
}
