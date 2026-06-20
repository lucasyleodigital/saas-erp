import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as XLSX from "xlsx";

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  total: number;
  inserted: number;
  skipped: number;
  errors: ImportError[];
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  private parseFile(buffer: Buffer): any[] {
    const raw = buffer.toString("utf8").trimStart();

    // Detect JSON (array or object)
    if (raw.startsWith("[") || raw.startsWith("{")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        // Support keyed objects: { clients: [...] }, { data: [...] }, etc.
        for (const key of ["clients", "products", "invoices", "data", "items", "records", "rows"]) {
          if (Array.isArray((parsed as any)[key])) return (parsed as any)[key];
        }
        // Single object → wrap
        return [parsed];
      } catch {
        throw new BadRequestException("El JSON no es válido. Comprueba el formato del archivo.");
      }
    }

    // Excel / CSV fallback
    try {
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]!];
      if (!ws) throw new Error("Hoja vacía");
      return XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];
    } catch {
      throw new BadRequestException("No se pudo leer el archivo. Usa formato .xlsx, .csv o .json");
    }
  }

  async importClients(companyId: string, buffer: Buffer): Promise<ImportResult> {
    const rows = this.parseFile(buffer);
    if (rows.length === 0) return { total: 0, inserted: 0, skipped: 0, errors: [] };

    let inserted = 0;
    let skipped = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2;

      const name = String(row["Nombre"] ?? row["name"] ?? "").trim();
      if (!name) {
        errors.push({ row: rowNum, field: "Nombre", message: "Campo obligatorio" });
        continue;
      }

      const email = String(row["Email"] ?? row["email"] ?? "").trim().toLowerCase() || undefined;
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNum, field: "Email", message: "Formato de email inválido" });
        continue;
      }

      try {
        const existing = await this.prisma.client.findFirst({
          where: { companyId, name: { equals: name, mode: "insensitive" } },
        });
        if (existing) { skipped++; continue; }

        await this.prisma.client.create({
          data: {
            companyId,
            name,
            email,
            phone: String(row["Teléfono"] ?? row["telefono"] ?? row["phone"] ?? "").trim() || undefined,
            cifNif: String(row["CIF/NIF"] ?? row["cif"] ?? row["nif"] ?? "").trim() || undefined,
            address: String(row["Dirección"] ?? row["direccion"] ?? row["address"] ?? "").trim() || undefined,
            city: String(row["Ciudad"] ?? row["city"] ?? "").trim() || undefined,
            province: String(row["Provincia"] ?? row["province"] ?? "").trim() || undefined,
            postalCode: String(row["Código postal"] ?? row["postal"] ?? "").trim() || undefined,
            country: String(row["País"] ?? row["country"] ?? "").trim() || "ES",
            website: String(row["Web"] ?? row["website"] ?? "").trim() || undefined,
            notes: String(row["Notas"] ?? row["notes"] ?? "").trim() || undefined,
          },
        });
        inserted++;
      } catch {
        errors.push({ row: rowNum, field: "—", message: "Error al insertar registro" });
      }
    }

    return { total: rows.length, inserted, skipped, errors };
  }

  async importProducts(companyId: string, buffer: Buffer): Promise<ImportResult> {
    const rows = this.parseFile(buffer);
    if (rows.length === 0) return { total: 0, inserted: 0, skipped: 0, errors: [] };

    let inserted = 0;
    let skipped = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2;

      const name = String(row["Nombre"] ?? row["name"] ?? "").trim();
      if (!name) {
        errors.push({ row: rowNum, field: "Nombre", message: "Campo obligatorio" });
        continue;
      }

      const priceRaw = row["Precio"] ?? row["price"] ?? "";
      const price = parseFloat(String(priceRaw).replace(",", "."));
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowNum, field: "Precio", message: "Precio inválido o negativo" });
        continue;
      }

      const typeRaw = String(row["Tipo"] ?? row["type"] ?? "SERVICE").trim().toUpperCase();
      const type = ["SERVICE", "DIGITAL", "PHYSICAL"].includes(typeRaw) ? typeRaw : "SERVICE";

      try {
        const existing = await this.prisma.product.findFirst({
          where: { companyId, name: { equals: name, mode: "insensitive" } },
        });
        if (existing) { skipped++; continue; }

        const costRaw = row["Coste"] ?? row["cost"] ?? "";
        const cost = parseFloat(String(costRaw).replace(",", "."));

        await this.prisma.product.create({
          data: {
            companyId,
            name,
            price,
            cost: isNaN(cost) ? undefined : cost,
            sku: String(row["SKU"] ?? row["sku"] ?? "").trim() || undefined,
            description: String(row["Descripción"] ?? row["descripcion"] ?? row["description"] ?? "").trim() || undefined,
            type: type as any,
            trackStock: ["SI", "SÍ", "YES", "TRUE", "1"].includes(
              String(row["Control stock"] ?? "NO").trim().toUpperCase()
            ),
          },
        });
        inserted++;
      } catch {
        errors.push({ row: rowNum, field: "—", message: "Error al insertar registro" });
      }
    }

    return { total: rows.length, inserted, skipped, errors };
  }

  async importInvoices(companyId: string, buffer: Buffer): Promise<ImportResult> {
    const rows = this.parseFile(buffer);
    if (rows.length === 0) return { total: 0, inserted: 0, skipped: 0, errors: [] };

    let inserted = 0;
    let skipped = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2;

      const number = String(row["Número"] ?? row["numero"] ?? row["number"] ?? "").trim();
      if (!number) {
        errors.push({ row: rowNum, field: "Número", message: "Campo obligatorio" });
        continue;
      }

      const clientName = String(row["Cliente"] ?? row["client"] ?? "").trim();
      if (!clientName) {
        errors.push({ row: rowNum, field: "Cliente", message: "Nombre de cliente obligatorio" });
        continue;
      }

      const totalRaw = row["Total"] ?? row["total"] ?? "";
      const total = parseFloat(String(totalRaw).replace(",", "."));
      if (isNaN(total) || total < 0) {
        errors.push({ row: rowNum, field: "Total", message: "Total inválido" });
        continue;
      }

      try {
        const existing = await this.prisma.invoice.findFirst({
          where: { companyId, number },
        });
        if (existing) { skipped++; continue; }

        let client = await this.prisma.client.findFirst({
          where: { companyId, name: { equals: clientName, mode: "insensitive" } },
        });
        if (!client) {
          client = await this.prisma.client.create({
            data: { companyId, name: clientName },
          });
        }

        const issueDateRaw = row["Fecha emisión"] ?? row["fecha"] ?? row["issueDate"];
        let issueDate: Date;
        if (issueDateRaw instanceof Date) {
          issueDate = issueDateRaw;
        } else {
          const parsed = Date.parse(String(issueDateRaw ?? ""));
          issueDate = isNaN(parsed) ? new Date() : new Date(parsed);
        }

        const dueDateRaw = row["Fecha vencimiento"] ?? row["dueDate"];
        let dueDate: Date | undefined;
        if (dueDateRaw instanceof Date) {
          dueDate = dueDateRaw;
        } else if (dueDateRaw) {
          const parsed = Date.parse(String(dueDateRaw));
          dueDate = isNaN(parsed) ? undefined : new Date(parsed);
        }

        const subtotal = total / 1.21;
        const taxAmount = total - subtotal;

        const statusRaw = String(row["Estado"] ?? row["status"] ?? "PAID").trim().toUpperCase();
        const validStatuses = ["DRAFT", "SENT", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"];
        const status = validStatuses.includes(statusRaw) ? statusRaw : "PAID";

        await this.prisma.invoice.create({
          data: {
            companyId,
            clientId: client.id,
            number,
            status: status as any,
            issueDate,
            dueDate,
            subtotal,
            taxAmount,
            total,
            paidAmount: status === "PAID" ? total : 0,
            notes: String(row["Notas"] ?? row["notes"] ?? "").trim() || undefined,
            items: {
              create: [{
                description: String(row["Descripción"] ?? row["descripcion"] ?? "Importación histórica").trim() || "Importación histórica",
                quantity: 1,
                unitPrice: subtotal,
                discount: 0,
                subtotal,
                order: 0,
              }],
            },
          },
        });
        inserted++;
      } catch {
        errors.push({ row: rowNum, field: "—", message: "Error al insertar registro" });
      }
    }

    return { total: rows.length, inserted, skipped, errors };
  }

  generateTemplate(entity: "clients" | "products" | "invoices"): Buffer {
    const templates = {
      clients: {
        headers: ["Nombre", "Email", "Teléfono", "CIF/NIF", "Dirección", "Ciudad", "Provincia", "Código postal", "País", "Web", "Notas"],
        example: ["Empresa Ejemplo S.L.", "contacto@empresa.com", "912345678", "B12345678", "Calle Mayor 1", "Madrid", "Madrid", "28001", "ES", "www.empresa.com", ""],
      },
      products: {
        headers: ["Nombre", "SKU", "Descripción", "Precio", "Coste", "Tipo", "Control stock"],
        example: ["Consultoría hora", "CONS-001", "Hora de consultoría", "75.00", "0", "SERVICE", "NO"],
      },
      invoices: {
        headers: ["Número", "Cliente", "Fecha emisión", "Fecha vencimiento", "Total", "Estado", "Descripción", "Notas"],
        example: ["FAC-2024-0001", "Cliente Ejemplo S.L.", "2024-01-15", "2024-02-15", "1210.00", "PAID", "Servicios enero", ""],
      },
    };

    const tpl = templates[entity];
    const ws = XLSX.utils.aoa_to_sheet([tpl.headers, tpl.example]);

    // Column widths
    ws["!cols"] = tpl.headers.map(() => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  }
}
