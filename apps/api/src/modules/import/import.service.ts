import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as XLSX from "xlsx";

export interface ImportError { row: number; field: string; message: string; }
export interface ImportResult { total: number; inserted: number; skipped: number; errors: ImportError[]; }
export interface FieldDef { key: string; label: string; required: boolean; aliases: string[]; }
export interface PreviewResult {
  columns: string[];
  sample: Record<string, string>[];
  suggestions: Record<string, string>; // fieldKey → sourceColumn
  fields: FieldDef[];
}

// ── Alias tables ─────────────────────────────────────────────────────────────
const CLIENT_FIELDS: FieldDef[] = [
  { key: "name",       label: "Nombre",        required: true,  aliases: ["Nombre","nombre","name","nom","nombre empresa","nombre_empresa","razon social","razon_social","razonsocial","denominacion","empresa","company","client","cliente","customer","customer name","client name","company name","full name","nombre completo"] },
  { key: "email",      label: "Email",          required: false, aliases: ["Email","email","mail","e-mail","correo","correo electronico","correo_electronico","email address"] },
  { key: "phone",      label: "Teléfono",       required: false, aliases: ["Teléfono","Telefono","telefono","phone","tel","movil","móvil","mobile","tlf","telf","telefono1","phone1"] },
  { key: "cifNif",     label: "CIF/NIF",        required: false, aliases: ["CIF/NIF","CIF","NIF","DNI","cif","nif","dni","vat","vat number","tax id","tax_id","id fiscal","id_fiscal","rut","rfc"] },
  { key: "address",    label: "Dirección",      required: false, aliases: ["Dirección","Direccion","direccion","address","dir","calle","domicilio","via","street","direccion fiscal","domicilio social"] },
  { key: "city",       label: "Ciudad",         required: false, aliases: ["Ciudad","ciudad","city","poblacion","población","municipio","localidad"] },
  { key: "province",   label: "Provincia",      required: false, aliases: ["Provincia","provincia","province","prov","region","state","comunidad"] },
  { key: "postalCode", label: "Código postal",  required: false, aliases: ["Código postal","Codigo postal","codigo postal","codigopostal","postal","postalCode","zip","cp","zipcode"] },
  { key: "country",    label: "País",           required: false, aliases: ["País","Pais","pais","country","pais iso","iso"] },
  { key: "website",    label: "Web",            required: false, aliases: ["Web","web","website","url","URL","pagina web","página web","sitio web"] },
  { key: "notes",      label: "Notas",          required: false, aliases: ["Notas","notas","notes","nota","observaciones","comentarios","remarks"] },
];

const PRODUCT_FIELDS: FieldDef[] = [
  { key: "name",        label: "Nombre",       required: true,  aliases: ["Nombre","nombre","name","nom","nombre producto","producto","product","servicio","service","articulo","artículo","titulo","title"] },
  { key: "price",       label: "Precio",       required: true,  aliases: ["Precio","precio","price","pvp","PVP","importe","amount","valor","sale price","precio venta"] },
  { key: "sku",         label: "SKU",          required: false, aliases: ["SKU","sku","codigo","código","referencia","ref","codigo producto","product code","barcode"] },
  { key: "description", label: "Descripción",  required: false, aliases: ["Descripción","Descripcion","descripcion","description","desc","descripcion larga","detalle","detail","info"] },
  { key: "cost",        label: "Coste",        required: false, aliases: ["Coste","coste","cost","coste unitario","precio coste","costo","purchase price"] },
  { key: "type",        label: "Tipo",         required: false, aliases: ["Tipo","tipo","type","tipo producto","product type","cat","categoria","categoría"] },
  { key: "trackStock",  label: "Control stock",required: false, aliases: ["Control stock","control_stock","controlstock","stock","track stock","inventario"] },
];

const INVOICE_FIELDS: FieldDef[] = [
  { key: "number",      label: "Número",           required: true,  aliases: ["Número","Numero","numero","number","num","num factura","num_factura","factura","invoice number","invoice","folio","ref","referencia","id factura","doc number"] },
  { key: "clientName",  label: "Cliente",          required: true,  aliases: ["Cliente","cliente","client","cliNom","clinom","nombre cliente","customer","razon social","empresa","company","bill to","receptor","destinatario"] },
  { key: "total",       label: "Total",            required: true,  aliases: ["Total","total","importe total","importe_total","amount","total amount","grand total","total factura","bruto","gross"] },
  { key: "issueDate",   label: "Fecha emisión",    required: false, aliases: ["Fecha emisión","Fecha emision","fecha emision","fecha_emision","fecha","date","issue date","invoice date","fecha factura","fecha expedicion","emision","created at"] },
  { key: "dueDate",     label: "Fecha vencimiento",required: false, aliases: ["Fecha vencimiento","Fecha vencim","fecha vencimiento","fecha_vencimiento","dueDate","venc","due date","vencimiento","expiry date","payment due"] },
  { key: "subtotal",    label: "Base imponible",   required: false, aliases: ["Base","base","subtotal","Subtotal","base imponible","base_imponible","neto","net","net amount"] },
  { key: "status",      label: "Estado",           required: false, aliases: ["Estado","estado","status","est","estado factura","payment status","situacion"] },
  { key: "description", label: "Descripción",      required: false, aliases: ["Descripción","Descripcion","descripcion","description","desc","concepto","detalle","linea","línea"] },
  { key: "notes",       label: "Notas",            required: false, aliases: ["Notas","notas","notes","nota","observaciones","comentarios"] },
];

const SUPPLIER_FIELDS: FieldDef[] = [
  { key: "name",        label: "Nombre",          required: true,  aliases: ["Nombre","nombre","name","nom","proveedor","supplier","razon social","razonsocial","empresa","company"] },
  { key: "email",       label: "Email",            required: false, aliases: ["Email","email","mail","correo","correo electronico"] },
  { key: "phone",       label: "Teléfono",         required: false, aliases: ["Teléfono","Telefono","telefono","phone","tel","movil","tlf"] },
  { key: "cifNif",      label: "CIF/NIF",          required: false, aliases: ["CIF/NIF","CIF","NIF","cif","nif","nif","vat","tax id","id fiscal","rut","rfc"] },
  { key: "contactName", label: "Persona contacto", required: false, aliases: ["Contacto","contacto","contact","contact name","persona contacto","persona_contacto","cont","responsable"] },
  { key: "address",     label: "Dirección",        required: false, aliases: ["Dirección","Direccion","direccion","address","dir","calle","domicilio"] },
  { key: "city",        label: "Ciudad",            required: false, aliases: ["Ciudad","ciudad","city","poblacion","municipio","localidad"] },
  { key: "country",     label: "País",              required: false, aliases: ["País","Pais","pais","country"] },
  { key: "website",     label: "Web",               required: false, aliases: ["Web","web","website","url","URL","web","pagina web"] },
  { key: "bankAccount", label: "IBAN / Cuenta",    required: false, aliases: ["IBAN","iban","cuenta bancaria","cuenta","bank account","bankAccount","bank","cuenta_bancaria","ref"] },
  { key: "notes",       label: "Notas",             required: false, aliases: ["Notas","notas","notes","nota","observaciones","comentarios"] },
];

const ENTITY_FIELDS: Record<string, FieldDef[]> = {
  clients:   CLIENT_FIELDS,
  products:  PRODUCT_FIELDS,
  invoices:  INVOICE_FIELDS,
  suppliers: SUPPLIER_FIELDS,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[\s/_\-\.]+/g, "");
}

// Find the first source column that fuzzy-matches any alias
function detectColumn(sourceColumns: string[], aliases: string[]): string | undefined {
  const normCols = sourceColumns.map(c => ({ orig: c, n: norm(c) }));
  for (const alias of aliases) {
    const match = normCols.find(c => c.n === norm(alias));
    if (match) return match.orig;
  }
  return undefined;
}

// Get a value from a row using explicit mapping, then fallback to alias auto-detection
function resolve(
  row: Record<string, any>,
  mapping: Record<string, string>,
  fieldKey: string,
  aliases: string[],
): string {
  const explicitCol = mapping[fieldKey];
  if (explicitCol) {
    const v = row[explicitCol];
    if (v !== undefined && v !== null) return String(v).trim();
  }
  // Auto-detect fallback
  const lookup: Record<string, any> = {};
  for (const key of Object.keys(row)) lookup[norm(key)] = row[key];
  for (const alias of aliases) {
    const v = lookup[norm(alias)];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function parseDate(raw: string | Date | undefined): Date | undefined {
  if (!raw) return undefined;
  if (raw instanceof Date) return raw;
  const s = String(raw).trim();
  const dmY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmY) return new Date(`${dmY[3]}-${dmY[2]!.padStart(2,"0")}-${dmY[1]!.padStart(2,"0")}`);
  const parsed = Date.parse(s);
  return isNaN(parsed) ? undefined : new Date(parsed);
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  parseFile(buffer: Buffer, entity?: string): any[] {
    const raw = buffer.toString("utf8").trimStart();
    if (raw.startsWith("[") || raw.startsWith("{")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;

        const ENTITY_KEYS: Record<string, string[]> = {
          clients:   ["clientes", "clients"],
          products:  ["productos", "products"],
          invoices:  ["facturas", "invoices"],
          suppliers: ["proveedoresDir", "proveedores", "suppliers"],
        };
        const primaryKeys = entity ? (ENTITY_KEYS[entity] ?? []) : [];
        const searchKeys = [...primaryKeys, "data", "items", "records", "rows",
          "clientes", "clients", "productos", "products", "facturas", "invoices",
          "proveedoresDir", "proveedores", "suppliers"];

        // Top-level search
        for (const key of searchKeys) {
          if (Array.isArray((parsed as any)[key])) return (parsed as any)[key];
        }
        // One level deeper (e.g. { datos: { clientes: [...] } })
        for (const wrapperKey of Object.keys(parsed)) {
          const wrapper = (parsed as any)[wrapperKey];
          if (wrapper && typeof wrapper === "object" && !Array.isArray(wrapper)) {
            for (const key of searchKeys) {
              if (Array.isArray(wrapper[key])) return wrapper[key];
            }
          }
        }
        return [parsed];
      } catch { throw new BadRequestException("El JSON no es válido."); }
    }
    try {
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]!];
      if (!ws) throw new Error("Hoja vacía");
      return XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];
    } catch { throw new BadRequestException("No se pudo leer el archivo. Usa .xlsx, .csv o .json"); }
  }

  // ── Preview: detect columns + suggest mapping ─────────────────────────────
  previewImport(entity: string, buffer: Buffer): PreviewResult {
    const fields = ENTITY_FIELDS[entity];
    if (!fields) throw new BadRequestException("Entidad no válida");

    const rows = this.parseFile(buffer, entity);
    if (!rows.length) throw new BadRequestException(
      "No se encontraron filas de datos en el archivo. " +
      "Comprueba que el archivo tiene datos y que la primera fila contiene los nombres de columna."
    );

    const columns = Object.keys(rows[0]);
    const sample = rows.slice(0, 3).map(r =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")]))
    );

    const suggestions: Record<string, string> = {};
    for (const field of fields) {
      const col = detectColumn(columns, field.aliases);
      if (col) suggestions[field.key] = col;
    }

    return { columns, sample, suggestions, fields };
  }

  // ── Import clients ────────────────────────────────────────────────────────
  async importClients(companyId: string, buffer: Buffer, mapping: Record<string, string> = {}): Promise<ImportResult> {
    const rows = this.parseFile(buffer, "clients");
    if (!rows.length) return { total: 0, inserted: 0, skipped: 0, errors: [] };

    let inserted = 0, skipped = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2;
      const r = (key: string) => resolve(row, mapping, key, CLIENT_FIELDS.find(f => f.key === key)!.aliases);

      const name = r("name");
      if (!name) { errors.push({ row: rowNum, field: "Nombre", message: "Campo obligatorio" }); continue; }

      const email = r("email").toLowerCase() || undefined;
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNum, field: "Email", message: "Formato de email inválido" }); continue;
      }

      try {
        const existing = await this.prisma.client.findFirst({ where: { companyId, name: { equals: name, mode: "insensitive" } } });
        if (existing) { skipped++; continue; }

        await this.prisma.client.create({ data: {
          companyId, name, email,
          phone:      r("phone")      || undefined,
          cifNif:     r("cifNif")     || undefined,
          address:    r("address")    || undefined,
          city:       r("city")       || undefined,
          province:   r("province")   || undefined,
          postalCode: r("postalCode") || undefined,
          country:    r("country")    || "ES",
          website:    r("website")    || undefined,
          notes:      r("notes")      || undefined,
        }});
        inserted++;
      } catch { errors.push({ row: rowNum, field: "—", message: "Error al insertar registro" }); }
    }
    return { total: rows.length, inserted, skipped, errors };
  }

  // ── Import products ───────────────────────────────────────────────────────
  async importProducts(companyId: string, buffer: Buffer, mapping: Record<string, string> = {}): Promise<ImportResult> {
    const rows = this.parseFile(buffer, "products");
    if (!rows.length) return { total: 0, inserted: 0, skipped: 0, errors: [] };

    let inserted = 0, skipped = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2;
      const r = (key: string) => resolve(row, mapping, key, PRODUCT_FIELDS.find(f => f.key === key)!.aliases);

      const name = r("name");
      if (!name) { errors.push({ row: rowNum, field: "Nombre", message: "Campo obligatorio" }); continue; }

      const price = parseFloat(r("price").replace(",", "."));
      if (isNaN(price) || price < 0) { errors.push({ row: rowNum, field: "Precio", message: "Precio inválido o negativo" }); continue; }

      const typeRaw = r("type").toUpperCase();
      const type = ["SERVICE","DIGITAL","PHYSICAL"].includes(typeRaw) ? typeRaw : "SERVICE";
      const cost = parseFloat(r("cost").replace(",", "."));
      const stockRaw = r("trackStock").toUpperCase();

      try {
        const existing = await this.prisma.product.findFirst({ where: { companyId, name: { equals: name, mode: "insensitive" } } });
        if (existing) { skipped++; continue; }

        await this.prisma.product.create({ data: {
          companyId, name, price,
          cost:        isNaN(cost) ? undefined : cost,
          sku:         r("sku")         || undefined,
          description: r("description") || undefined,
          type:        type as any,
          trackStock:  ["SI","SÍ","YES","TRUE","1","ACTIVO","ACTIVE"].includes(stockRaw),
        }});
        inserted++;
      } catch { errors.push({ row: rowNum, field: "—", message: "Error al insertar registro" }); }
    }
    return { total: rows.length, inserted, skipped, errors };
  }

  // ── Import invoices ───────────────────────────────────────────────────────
  async importInvoices(companyId: string, buffer: Buffer, mapping: Record<string, string> = {}): Promise<ImportResult> {
    const rows = this.parseFile(buffer, "invoices");
    if (!rows.length) return { total: 0, inserted: 0, skipped: 0, errors: [] };

    let inserted = 0, skipped = 0;
    const errors: ImportError[] = [];

    const STATUS_MAP: Record<string, string> = {
      PAGADA:"PAID", PAID:"PAID", COBRADA:"PAID",
      ENVIADA:"SENT", SENT:"SENT", EMITIDA:"SENT", PENDIENTE:"SENT",
      BORRADOR:"DRAFT", DRAFT:"DRAFT",
      VENCIDA:"OVERDUE", OVERDUE:"OVERDUE",
      PARCIAL:"PARTIAL", PARTIAL:"PARTIAL",
      CANCELADA:"CANCELLED", CANCELLED:"CANCELLED", ANULADA:"CANCELLED",
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2;
      const r = (key: string) => resolve(row, mapping, key, INVOICE_FIELDS.find(f => f.key === key)!.aliases);

      const number = r("number");
      if (!number) { errors.push({ row: rowNum, field: "Número", message: "Campo obligatorio" }); continue; }

      const clientName = r("clientName");
      if (!clientName) { errors.push({ row: rowNum, field: "Cliente", message: "Campo obligatorio" }); continue; }

      const total = parseFloat(r("total").replace(",", "."));
      if (isNaN(total) || total < 0) { errors.push({ row: rowNum, field: "Total", message: "Total inválido" }); continue; }

      try {
        const existing = await this.prisma.invoice.findFirst({ where: { companyId, number } });
        if (existing) { skipped++; continue; }

        let client = await this.prisma.client.findFirst({ where: { companyId, name: { equals: clientName, mode: "insensitive" } } });
        if (!client) client = await this.prisma.client.create({ data: { companyId, name: clientName } });

        const issueDate = parseDate(r("issueDate")) ?? new Date();
        const dueDate   = parseDate(r("dueDate"));

        const subtotalRaw = parseFloat(r("subtotal").replace(",", "."));
        const subtotal    = isNaN(subtotalRaw) ? total / 1.21 : subtotalRaw;
        const taxAmount   = total - subtotal;

        const statusRaw = r("status").toUpperCase();
        const status = STATUS_MAP[statusRaw] ?? "PAID";
        const description = r("description") || "Importación histórica";

        await this.prisma.invoice.create({ data: {
          companyId, clientId: client.id, number,
          status: status as any, issueDate, dueDate,
          subtotal, taxAmount, total,
          paidAmount: status === "PAID" ? total : 0,
          notes: r("notes") || undefined,
          items: { create: [{ description, quantity: 1, unitPrice: subtotal, discount: 0, subtotal, order: 0 }] },
        }});
        inserted++;
      } catch { errors.push({ row: rowNum, field: "—", message: "Error al insertar registro" }); }
    }
    return { total: rows.length, inserted, skipped, errors };
  }

  // ── Import suppliers ──────────────────────────────────────────────────────
  async importSuppliers(companyId: string, buffer: Buffer, mapping: Record<string, string> = {}): Promise<ImportResult> {
    const rows = this.parseFile(buffer, "suppliers");
    if (!rows.length) return { total: 0, inserted: 0, skipped: 0, errors: [] };

    let inserted = 0, skipped = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2;
      const r = (key: string) => resolve(row, mapping, key, SUPPLIER_FIELDS.find(f => f.key === key)!.aliases);

      const name = r("name");
      if (!name) { errors.push({ row: rowNum, field: "Nombre", message: "Campo obligatorio" }); continue; }

      try {
        const existing = await this.prisma.supplier.findFirst({ where: { companyId, name: { equals: name, mode: "insensitive" } } });
        if (existing) { skipped++; continue; }

        await this.prisma.supplier.create({ data: {
          companyId, name,
          email:       r("email").toLowerCase() || undefined,
          phone:       r("phone")       || undefined,
          cifNif:      r("cifNif")      || undefined,
          contactName: r("contactName") || undefined,
          address:     r("address")     || undefined,
          city:        r("city")        || undefined,
          country:     r("country")     || "ES",
          website:     r("website")     || undefined,
          bankAccount: r("bankAccount") || undefined,
          notes:       r("notes")       || undefined,
        }});
        inserted++;
      } catch { errors.push({ row: rowNum, field: "—", message: "Error al insertar registro" }); }
    }
    return { total: rows.length, inserted, skipped, errors };
  }

  // ── Template generator ────────────────────────────────────────────────────
  generateTemplate(entity: "clients" | "products" | "invoices" | "suppliers"): Buffer {
    const templates = {
      clients:   { headers: ["Nombre","Email","Teléfono","CIF/NIF","Dirección","Ciudad","Provincia","Código postal","País","Web","Notas"],    example: ["Empresa Ejemplo S.L.","contacto@empresa.com","912345678","B12345678","Calle Mayor 1","Madrid","Madrid","28001","ES","www.empresa.com",""] },
      products:  { headers: ["Nombre","SKU","Descripción","Precio","Coste","Tipo","Control stock"],                                          example: ["Consultoría hora","CONS-001","Hora de consultoría","75.00","0","SERVICE","NO"] },
      invoices:  { headers: ["Número","Cliente","Fecha emisión","Fecha vencimiento","Total","Estado","Descripción","Notas"],                 example: ["FAC-2024-0001","Cliente Ejemplo S.L.","2024-01-15","2024-02-15","1210.00","PAID","Servicios enero",""] },
      suppliers: { headers: ["Nombre","Email","Teléfono","CIF/NIF","Persona contacto","Dirección","Ciudad","País","Web","IBAN / Cuenta","Notas"], example: ["Proveedor S.L.","proveedor@email.com","912345678","B87654321","Ana García","Calle Industria 5","Barcelona","ES","www.proveedor.com","ES12 1234 5678 90 1234567890",""] },
    };
    const tpl = templates[entity];
    const ws = XLSX.utils.aoa_to_sheet([tpl.headers, tpl.example]);
    ws["!cols"] = tpl.headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  }
}
