import PDFDocument from "pdfkit";
import type { ContractDocument } from "./contract-content";

export async function generateContractPdf(doc: ContractDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: "A4", margin: 56 });
    const chunks: Buffer[] = [];
    pdf.on("data", (c: Buffer) => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    pdf.fontSize(18).fillColor("#0d9488").text("Contrato de Servicios YouWhole", { align: "left" });
    pdf.moveDown(0.2);
    pdf
      .fontSize(10)
      .fillColor("#6b7280")
      .text(`Plan ${doc.planLabel} · Aceptado el ${doc.dateStr} · Versión ${doc.version}`);
    pdf.moveDown(1);

    pdf.fontSize(11).fillColor("#111827").text("Datos de la suscripción", { underline: true });
    pdf.moveDown(0.3);
    pdf.fontSize(9).fillColor("#374151");
    const rows: [string, string][] = [
      ["Empresa", doc.companyName],
      ["CIF/NIF", doc.cif ?? "—"],
      ["Plan", doc.planLabel],
      ["Importe", doc.price > 0 ? `${doc.price}€/mes (IVA incluido)` : "0€ (plan gratuito)"],
      ["Fecha", doc.dateStr],
      [
        "Renovación",
        doc.price > 0 ? "Automática mensual · Sin permanencia" : "No aplica (plan gratuito)",
      ],
    ];
    for (const [label, value] of rows) {
      pdf.text(`${label}: ${value}`);
    }
    pdf.moveDown(1);

    doc.sections.forEach((section, i) => {
      pdf.fontSize(10).fillColor("#111827").text(`${i + 1}. ${section.title}`, { underline: true });
      pdf.moveDown(0.2);
      pdf
        .fontSize(9)
        .fillColor("#374151")
        .text(section.body.replace(/<\/?strong>/g, ""), { align: "justify" });
      pdf.moveDown(0.8);
    });

    pdf.moveDown(0.5);
    pdf
      .fontSize(9)
      .fillColor("#0d9488")
      .text(
        "Este documento es un resumen de las condiciones de tu suscripción. El contrato completo " +
          "-- incluyendo limitacion de responsabilidad, uso aceptable, derecho de desistimiento y el " +
          "detalle completo de proteccion de datos (RGPD Art. 28) -- esta en youwhole.com/terminos, " +
          "que aceptaste expresamente al registrarte.",
        { align: "justify" }
      );
    pdf.moveDown(0.8);
    pdf
      .fontSize(8)
      .fillColor("#9ca3af")
      .text(
        "Este documento confirma la aceptación del contrato de servicios de YouWhole. " +
          "Contacto: ventas@youwhole.com · YouWhole es una marca comercial de Alex Lucas Torrubia."
      );

    pdf.end();
  });
}
