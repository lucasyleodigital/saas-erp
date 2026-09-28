import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import ExcelJS from "exceljs";

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportClients(companyId: string): Promise<Buffer> {
    const clients = await this.prisma.client.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
    });

    const rows = clients.map((c) => ({
      Nombre: c.name,
      Email: c.email ?? "",
      "Telefono": c.phone ?? "",
      "CIF/NIF": c.cifNif ?? "",
      "Direccion": c.address ?? "",
      Ciudad: c.city ?? "",
      Provincia: c.province ?? "",
      "Codigo postal": c.postalCode ?? "",
      "Pais": c.country ?? "",
      Web: c.website ?? "",
      "Total facturado": Number(c.totalBilled),
      "Pendiente cobro": Number(c.pendingBalance),
      Notas: c.notes ?? "",
    }));

    return this.toXlsx(rows, "Clientes");
  }

  async exportProducts(companyId: string): Promise<Buffer> {
    const products = await this.prisma.product.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
    });

    const rows = products.map((p) => ({
      Nombre: p.name,
      SKU: p.sku ?? "",
      "Descripcion": p.description ?? "",
      Precio: Number(p.price),
      Coste: Number(p.cost),
      Tipo: p.type,
      "Control stock": p.trackStock ? "SI" : "NO",
    }));

    return this.toXlsx(rows, "Productos");
  }

  async exportInvoices(companyId: string, filters?: { status?: string; dateFrom?: string; dateTo?: string }): Promise<Buffer> {
    const where: any = { companyId };
    if (filters?.status) where.status = filters.status;
    if (filters?.dateFrom || filters?.dateTo) {
      where.issueDate = {};
      if (filters?.dateFrom) where.issueDate.gte = new Date(filters.dateFrom);
      if (filters?.dateTo) where.issueDate.lte = new Date(filters.dateTo + "T23:59:59");
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: { client: { select: { name: true, cifNif: true } } },
      orderBy: { issueDate: "desc" },
    });

    const rows = invoices.map((inv) => ({
      "Numero": inv.number,
      Cliente: inv.client?.name ?? "",
      "CIF/NIF cliente": inv.client?.cifNif ?? "",
      "Fecha emision": inv.issueDate?.toISOString().slice(0, 10) ?? "",
      Vencimiento: inv.dueDate?.toISOString().slice(0, 10) ?? "",
      "Base imponible": Number(inv.subtotal),
      IVA: Number(inv.taxAmount),
      Total: Number(inv.total),
      Pagado: Number(inv.paidAmount),
      Estado: inv.status,
      Moneda: inv.currency,
      Notas: inv.notes ?? "",
    }));

    return this.toXlsx(rows, "Facturas");
  }

  async exportSuppliers(companyId: string): Promise<Buffer> {
    const suppliers = await this.prisma.supplier.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
    });

    const rows = suppliers.map((s) => ({
      Nombre: s.name,
      Email: s.email ?? "",
      "Telefono": s.phone ?? "",
      "CIF/NIF": s.cifNif ?? "",
      Contacto: s.contactName ?? "",
      "Direccion": s.address ?? "",
      Ciudad: s.city ?? "",
      "Pais": s.country ?? "",
      Web: s.website ?? "",
      "Cuenta bancaria": s.bankAccount ?? "",
      Notas: s.notes ?? "",
    }));

    return this.toXlsx(rows, "Proveedores");
  }

  private async toXlsx(rows: Record<string, any>[], sheetName: string): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(sheetName);
    const keys = Object.keys(rows[0] ?? {});
    ws.columns = keys.map((key) => {
      const maxLen = Math.max(key.length, ...rows.map((r) => String(r[key] ?? "").length));
      return { header: key, key, width: Math.min(maxLen + 2, 40) };
    });
    ws.addRows(rows);
    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}
