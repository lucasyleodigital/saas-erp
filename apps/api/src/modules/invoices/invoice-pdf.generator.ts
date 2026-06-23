import PDFDocument from "pdfkit";

const DEFAULT_COLOR = "#4f46e5";

function fmt(n: number, cur = "EUR") {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: cur }).format(n);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function generateInvoicePdf(invoice: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const co = invoice.company ?? {};
    const cl = invoice.client ?? {};
    const rawItems = invoice.items ?? [];
    const items = rawItems.length > 0 ? rawItems : [{
      description: invoice.notes || "Importacion historica",
      quantity: 1,
      unitPrice: Number(invoice.subtotal ?? invoice.total ?? 0),
      discount: 0,
      taxRate: 0,
      subtotal: Number(invoice.subtotal ?? invoice.total ?? 0),
    }];
    const taxes = invoice.taxes ?? [];
    const cur = invoice.currency ?? "EUR";
    const settings = (co.settings as any) ?? {};
    const primary = settings.invoiceColor || DEFAULT_COLOR;
    const bank = co.bankAccounts?.[0];

    const ivaTaxes = taxes.filter((t: any) => Number(t.rate) > 0);
    const irpfTaxes = taxes.filter((t: any) => Number(t.rate) < 0);
    const hasIrpf = irpfTaxes.length > 0;
    const irpfRate = hasIrpf ? Math.abs(Number(irpfTaxes[0].rate)) : 0;
    const ivaRate = ivaTaxes.length > 0 ? Number(ivaTaxes[0].rate) : 0;

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(20).fillColor(primary).text("FACTURA", 350, 50, { align: "right" });
    doc.fontSize(10).fillColor("#6b7280").text(invoice.number, 350, 74, { align: "right" });
    doc.fontSize(12).fillColor("#111827").text(co.legalName ?? co.name ?? "", 50, 50);
    doc.fontSize(8).fillColor("#6b7280");
    let yPos = 66;
    if (co.cif) { doc.text(`CIF: ${co.cif}`, 50, yPos); yPos += 12; }
    const addr = [co.address, co.postalCode, co.city, co.province].filter(Boolean).join(", ");
    if (addr) { doc.text(addr, 50, yPos); yPos += 12; }
    if (co.email) { doc.text(co.email, 50, yPos); yPos += 12; }
    if (co.phone) { doc.text(co.phone, 50, yPos); yPos += 12; }

    // Status badge
    const statusLabels: Record<string, string> = { DRAFT: "BORRADOR", SENT: "ENVIADA", PAID: "PAGADA", PARTIAL: "PARCIAL", OVERDUE: "VENCIDA", CANCELLED: "CANCELADA" };
    const statusColors: Record<string, string> = { DRAFT: "#6b7280", SENT: "#2563eb", PAID: "#059669", PARTIAL: "#d97706", OVERDUE: "#dc2626", CANCELLED: "#6b7280" };
    const statusText = statusLabels[invoice.status] ?? invoice.status;
    const statusColor = statusColors[invoice.status] ?? "#6b7280";
    doc.roundedRect(430, 88, 80, 18, 3).fill(statusColor);
    doc.fontSize(8).fillColor("#ffffff").text(statusText, 430, 92, { width: 80, align: "center" });

    // Client + dates box
    const boxY = 130;
    doc.roundedRect(50, boxY, 495, 70, 4).fill("#f9fafb");
    doc.fontSize(7).fillColor("#9ca3af").text("FACTURAR A", 60, boxY + 10);
    doc.fontSize(11).fillColor("#111827").text(cl.name ?? "", 60, boxY + 22);
    doc.fontSize(8).fillColor("#374151");
    if (cl.cifNif) doc.text(`CIF/NIF: ${cl.cifNif}`, 60, boxY + 38);
    if (cl.address) doc.text(cl.address, 60, boxY + 50);

    doc.fontSize(7).fillColor("#9ca3af").text("DETALLES", 320, boxY + 10);
    doc.fontSize(8).fillColor("#374151");
    doc.text(`Fecha: ${fmtDate(invoice.issueDate)}`, 320, boxY + 22);
    if (invoice.dueDate) doc.text(`Vencimiento: ${fmtDate(invoice.dueDate)}`, 320, boxY + 34);
    doc.text(`Moneda: ${cur}`, 320, boxY + 46);

    // Items table header
    let tableY = boxY + 85;
    doc.roundedRect(50, tableY, 495, 20, 3).fill(primary);
    doc.fontSize(7).fillColor("#ffffff");
    doc.text("CONCEPTO / SERVICIO", 58, tableY + 6, { width: 170 });
    doc.text("CANT.", 230, tableY + 6, { width: 35, align: "center" });
    doc.text("PRECIO UNIT.", 268, tableY + 6, { width: 60, align: "right" });
    doc.text("DTO.", 332, tableY + 6, { width: 35, align: "center" });
    if (ivaRate > 0) doc.text("IVA", 370, tableY + 6, { width: 30, align: "center" });
    if (hasIrpf) doc.text("IRPF", 403, tableY + 6, { width: 30, align: "center" });
    doc.text("IMPORTE", 438, tableY + 6, { width: 100, align: "right" });

    // Items rows
    tableY += 22;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (i % 2 === 1) doc.rect(50, tableY, 495, 18).fill("#f9fafb");
      doc.fontSize(8.5).fillColor("#374151");
      doc.text(item.description ?? "", 58, tableY + 4, { width: 165 });
      doc.text(String(Number(item.quantity)), 230, tableY + 4, { width: 35, align: "center" });
      doc.text(fmt(Number(item.unitPrice), cur), 268, tableY + 4, { width: 60, align: "right" });
      doc.text(Number(item.discount) > 0 ? `-${item.discount}%` : "--", 332, tableY + 4, { width: 35, align: "center" });
      if (ivaRate > 0) doc.text(`${ivaRate}%`, 370, tableY + 4, { width: 30, align: "center" });
      if (hasIrpf) doc.text(`${irpfRate}%`, 403, tableY + 4, { width: 30, align: "center" });
      doc.fillColor("#111827").text(fmt(Number(item.subtotal), cur), 438, tableY + 4, { width: 100, align: "right" });
      tableY += 18;
    }

    // Totals
    tableY += 10;
    const totX = 370;
    doc.fontSize(9).fillColor("#6b7280").text("Base imponible", totX, tableY);
    doc.fillColor("#111827").text(fmt(Number(invoice.subtotal), cur), 465, tableY, { width: 75, align: "right" });
    tableY += 16;

    if (ivaTaxes.length > 0) {
      for (const t of ivaTaxes) {
        doc.fillColor("#6b7280").text(`IVA ${t.rate}% (s/${fmt(Number(t.base ?? invoice.subtotal), cur)})`, totX, tableY);
        doc.fillColor("#111827").text(fmt(Number(t.amount), cur), 465, tableY, { width: 75, align: "right" });
        tableY += 16;
      }
    } else if (Number(invoice.taxAmount) > 0 && !hasIrpf) {
      doc.fillColor("#6b7280").text("IVA", totX, tableY);
      doc.fillColor("#111827").text(fmt(Number(invoice.taxAmount), cur), 465, tableY, { width: 75, align: "right" });
      tableY += 16;
    }

    for (const t of irpfTaxes) {
      doc.fillColor("#dc2626").text(`Retencion IRPF ${Math.abs(Number(t.rate))}%`, totX, tableY);
      doc.fillColor("#dc2626").text(fmt(Number(t.amount), cur), 465, tableY, { width: 75, align: "right" });
      tableY += 16;
    }

    tableY += 4;
    doc.roundedRect(totX - 5, tableY, 180, 26, 4).fill(primary);
    doc.fontSize(11).fillColor("#ffffff").text("TOTAL", totX + 5, tableY + 7);
    doc.text(fmt(Number(invoice.total), cur), 465, tableY + 7, { width: 75, align: "right" });
    tableY += 36;

    // Bank account
    if (bank?.iban) {
      doc.roundedRect(50, tableY, 495, 45, 4).fill("#f0f9ff");
      doc.moveTo(50, tableY).lineTo(53, tableY).lineTo(53, tableY + 45).lineTo(50, tableY + 45).fill(primary);
      doc.fontSize(7).fillColor("#9ca3af").text("DATOS DE PAGO", 62, tableY + 8);
      doc.fontSize(8.5).fillColor("#1e3a5f").text(`Titular: ${co.legalName ?? co.name}`, 62, tableY + 20);
      doc.font("Helvetica-Bold").text(`IBAN: ${bank.iban}`, 62, tableY + 32);
      doc.font("Helvetica");
      if (bank.bic) doc.text(`BIC: ${bank.bic}`, 300, tableY + 32);
      tableY += 55;
    }

    // Notes
    if (invoice.notes) {
      doc.roundedRect(50, tableY, 495, 40, 4).fill("#fefce8");
      doc.fontSize(8).fillColor("#713f12").text("Notas:", 62, tableY + 8);
      doc.text(invoice.notes, 62, tableY + 20, { width: 470 });
      tableY += 50;
    }

    // Footer
    const footerText = settings.invoiceFooter
      || [co.legalName ?? co.name, co.cif ? `CIF: ${co.cif}` : "", addr, co.email].filter(Boolean).join(" · ");
    doc.fontSize(7.5).fillColor("#9ca3af");
    doc.moveTo(50, 780).lineTo(545, 780).stroke("#e5e7eb");
    doc.text(footerText, 50, 788, { width: 495, align: "center" });

    doc.end();
  });
}
