import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as XLSX from "xlsx";

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

  async exportInvoices(companyId: string): Promise<Buffer> {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
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

  private toXlsx(rows: Record<string, any>[], sheetName: string): Buffer {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    const colWidths = Object.keys(rows[0] ?? {}).map((key) => {
      const maxLen = Math.max(key.length, ...rows.map((r) => String(r[key] ?? "").length));
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }
}
