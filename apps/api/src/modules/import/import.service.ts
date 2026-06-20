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

// Normalize a key for fuzzy matching: lowercase, strip accents, collapse separators
function n(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s/_\-\.]+/g, "");
}

// Pick a value from a row by trying candidate field names (accent+case+separator insensitive)
function pick(row: Record<string, any>, ...candidates: string[]): string {
  // Build a normalized lookup once per row
  const lookup: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    lookup[n(key)] = row[key];
  }
  for (const c of candidates) {
    const v = lookup[n(c)];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
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

      const name = pick(row,
        "Nombre", "nombre", "name", "Name",
        "nombre empresa", "nombre_empresa", "nombreempresa",
        "razon social", "razon_social", "razonsocial", "denominacion social", "denominacion",
        "empresa", "company", "client", "cliente", "customer",
        "customer name", "client name", "company name", "full name", "fullname",
        "nombre completo", "nombre_completo",
      );
      if (!name) {
        errors.push({ row: rowNum, field: "Nombre", message: "Campo obligatorio (prueba: Nombre, nombre_empresa, razon_social, company...)" });
        continue;
      }

      const email = pick(row,
        "Email", "email", "mail", "e-mail", "e_mail",
        "correo", "correo electronico", "correo_electronico", "correo-e",
        "email address", "emailaddress",
      ).toLowerCase() || undefined;
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
            phone: pick(row,
              "Teléfono", "Telefono", "telefono", "phone", "Phone", "tel", "Tel",
              "movil", "móvil", "mobile", "tlf", "telf",
              "telefono 1", "telefono1", "phone 1", "phone1",
            ) || undefined,
            cifNif: pick(row,
              "CIF/NIF", "CIF", "NIF", "DNI", "cif", "nif", "dni",
              "vat", "vat number", "vat_number", "tax id", "tax_id",
              "id fiscal", "id_fiscal", "identificacion fiscal",
              "rut", "rfc", "numero identificacion",
            ) || undefined,
            address: pick(row,
              "Dirección", "Direccion", "direccion", "address", "Address",
              "calle", "domicilio", "via", "street", "street address",
              "direccion fiscal", "domicilio social",
            ) || undefined,
            city: pick(row,
              "Ciudad", "ciudad", "city", "City",
              "poblacion", "población", "municipio", "municipality", "localidad",
            ) || undefined,
            province: pick(row,
              "Provincia", "provincia", "province", "Province",
              "region", "state", "comunidad", "autonomous community",
            ) || undefined,
            postalCode: pick(row,
              "Código postal", "Codigo postal", "codigo postal", "codigopostal",
              "postal", "postalCode", "zip", "cp", "zipcode", "zip code",
            ) || undefined,
            country: pick(row,
              "País", "Pais", "pais", "country", "Country",
              "pais iso", "country code", "iso",
            ) || "ES",
            website: pick(row,
              "Web", "web", "website", "Website", "url", "URL",
              "web site", "pagina web", "página web", "sitio web",
            ) || undefined,
            notes: pick(row,
              "Notas", "notas", "notes", "Notes", "nota",
              "observaciones", "observacion", "comments", "comentarios", "remarks",
            ) || undefined,
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

      const name = pick(row,
        "Nombre", "nombre", "name", "Name",
        "nombre producto", "nombre_producto", "product name", "productname",
        "producto", "product", "servicio", "service", "articulo", "artículo",
        "descripcion corta", "titulo", "título", "title",
      );
      if (!name) {
        errors.push({ row: rowNum, field: "Nombre", message: "Campo obligatorio (prueba: Nombre, product, servicio, titulo...)" });
        continue;
      }

      const priceRaw = pick(row,
        "Precio", "precio", "price", "Price",
        "precio venta", "precio_venta", "pvp", "PVP",
        "importe", "amount", "valor", "sale price",
      );
      const price = parseFloat(priceRaw.replace(",", "."));
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowNum, field: "Precio", message: "Precio inválido o negativo" });
        continue;
      }

      const typeRaw = pick(row,
        "Tipo", "tipo", "type", "Type",
        "tipo producto", "product type", "categoria", "categoría",
      ).toUpperCase();
      const type = ["SERVICE", "DIGITAL", "PHYSICAL"].includes(typeRaw) ? typeRaw : "SERVICE";

      try {
        const existing = await this.prisma.product.findFirst({
          where: { companyId, name: { equals: name, mode: "insensitive" } },
        });
        if (existing) { skipped++; continue; }

        const costRaw = pick(row,
          "Coste", "coste", "cost", "Cost",
          "coste unitario", "precio coste", "costo", "purchase price",
        );
        const cost = parseFloat(costRaw.replace(",", "."));

        const stockRaw = pick(row,
          "Control stock", "control_stock", "controlstock",
          "stock", "track stock", "gestionar stock", "inventario",
        ).toUpperCase();

        await this.prisma.product.create({
          data: {
            companyId,
            name,
            price,
            cost: isNaN(cost) ? undefined : cost,
            sku: pick(row,
              "SKU", "sku", "Sku", "codigo", "código",
              "referencia", "ref", "codigo producto", "product code", "barcode",
            ) || undefined,
            description: pick(row,
              "Descripción", "Descripcion", "descripcion", "description", "Description",
              "descripcion larga", "detalle", "detail", "info", "observaciones",
            ) || undefined,
            type: type as any,
            trackStock: ["SI", "SÍ", "YES", "TRUE", "1", "ACTIVO", "ACTIVE"].includes(stockRaw),
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

      const number = pick(row,
        "Número", "Numero", "numero", "number", "Number",
        "num factura", "num_factura", "factura", "invoice number", "invoice_number",
        "invoice", "numero factura", "ref", "referencia", "serie", "id factura",
        "invoice id", "doc number", "folio",
      );
      if (!number) {
        errors.push({ row: rowNum, field: "Número", message: "Campo obligatorio (prueba: Número, invoice_number, factura, folio...)" });
        continue;
      }

      const clientName = pick(row,
        "Cliente", "cliente", "client", "Client",
        "nombre cliente", "nombre_cliente", "customer", "customer name",
        "razon social", "empresa", "company", "bill to", "billto",
        "receptor", "destinatario",
      );
      if (!clientName) {
        errors.push({ row: rowNum, field: "Cliente", message: "Nombre de cliente obligatorio (prueba: Cliente, customer, empresa...)" });
        continue;
      }

      const totalRaw = pick(row,
        "Total", "total", "importe total", "importe_total",
        "amount", "total amount", "grand total", "total factura",
        "total iva incluido", "bruto", "gross",
      );
      const total = parseFloat(totalRaw.replace(",", "."));
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

        // Parse issue date — accept Date object, ISO string, DD/MM/YYYY, DD-MM-YYYY
        const issueDateRaw = pick(row,
          "Fecha emisión", "Fecha emision", "fecha emision", "fecha_emision",
          "fecha", "date", "issue date", "invoice date", "fecha factura",
          "fecha expedicion", "fecha_expedicion", "emision", "created at",
        );
        let issueDate: Date;
        const issueDateObj = (rows[i] as any)["Fecha emisión"] instanceof Date
          ? (rows[i] as any)["Fecha emisión"]
          : null;
        if (issueDateObj) {
          issueDate = issueDateObj;
        } else if (issueDateRaw) {
          // Try DD/MM/YYYY or DD-MM-YYYY
          const dmY = issueDateRaw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (dmY) {
            issueDate = new Date(`${dmY[3]}-${dmY[2]!.padStart(2, "0")}-${dmY[1]!.padStart(2, "0")}`);
          } else {
            const parsed = Date.parse(issueDateRaw);
            issueDate = isNaN(parsed) ? new Date() : new Date(parsed);
          }
        } else {
          issueDate = new Date();
        }

        const dueDateRaw = pick(row,
          "Fecha vencimiento", "Fecha vencim", "fecha vencimiento", "fecha_vencimiento",
          "dueDate", "due date", "vencimiento", "expiry date", "payment due",
        );
        let dueDate: Date | undefined;
        if (dueDateRaw) {
          const dmY = dueDateRaw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (dmY) {
            dueDate = new Date(`${dmY[3]}-${dmY[2]!.padStart(2, "0")}-${dmY[1]!.padStart(2, "0")}`);
          } else {
            const parsed = Date.parse(dueDateRaw);
            dueDate = isNaN(parsed) ? undefined : new Date(parsed);
          }
        }

        // Use real base+tax if present, otherwise estimate 21% IVA
        const subtotalRaw = parseFloat(pick(row,
          "Base", "base", "subtotal", "Subtotal",
          "base imponible", "base_imponible", "neto", "net", "net amount",
        ).replace(",", "."));
        const subtotal = isNaN(subtotalRaw) ? total / 1.21 : subtotalRaw;
        const taxAmount = total - subtotal;

        const statusRaw = pick(row,
          "Estado", "estado", "status", "Status",
          "estado factura", "payment status", "situacion",
        ).toUpperCase();
        const STATUS_MAP: Record<string, string> = {
          PAGADA: "PAID", PAID: "PAID", COBRADA: "PAID",
          ENVIADA: "SENT", SENT: "SENT", EMITIDA: "SENT",
          BORRADOR: "DRAFT", DRAFT: "DRAFT",
          VENCIDA: "OVERDUE", OVERDUE: "OVERDUE",
          PARCIAL: "PARTIAL", PARTIAL: "PARTIAL",
          CANCELADA: "CANCELLED", CANCELLED: "CANCELLED", ANULADA: "CANCELLED",
        };
        const status = STATUS_MAP[statusRaw] ?? "PAID";

        const description = pick(row,
          "Descripción", "Descripcion", "descripcion", "description", "Description",
          "concepto", "concepto factura", "detalle", "linea", "línea", "detail",
          "item", "items", "producto", "servicio",
        ) || "Importación histórica";

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
            notes: pick(row,
              "Notas", "notas", "notes", "Notes",
              "observaciones", "comentarios", "remarks",
            ) || undefined,
            items: {
              create: [{
                description,
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
