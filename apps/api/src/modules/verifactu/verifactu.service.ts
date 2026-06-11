import { Injectable, BadRequestException } from "@nestjs/common";
import { createHash } from "crypto";
import { create } from "xmlbuilder2";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class VerifactuService {
  constructor(private prisma: PrismaService) {}

  async generateForInvoice(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        client: true,
        items: true,
        taxes: { include: { tax: true } },
        company: true,
        verifactu: true,
      },
    });

    if (!invoice) throw new BadRequestException("Factura no encontrada");
    if ((invoice as any).verifactu) throw new BadRequestException("VeriFactu ya generado para esta factura");
    if (!["SENT", "PAID"].includes(invoice.status)) {
      throw new BadRequestException("Solo se puede generar VeriFactu para facturas enviadas o pagadas");
    }

    // Get previous hash for chain integrity
    const previousRecord = await this.prisma.verifactuRecord.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    const xml = this.buildXml(invoice, invoice.company);
    const hashInput = this.buildHashInput(invoice, previousRecord?.hash);
    const hash = createHash("sha256").update(hashInput, "utf8").digest("hex").toUpperCase();

    const record = await this.prisma.verifactuRecord.create({
      data: {
        companyId,
        invoiceId,
        xml,
        hash,
        previousHash: previousRecord?.hash ?? null,
        status: "GENERATED",
        qrCode: this.buildQrContent(invoice.company.cif ?? "", invoice.number, Number(invoice.total), invoice.issueDate),
      },
    });

    return record;
  }

  private buildXml(invoice: any, company: any): string {
    const root = create({ version: "1.0", encoding: "UTF-8" })
      .ele("soapenv:Envelope", {
        "xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
        "xmlns:sum": "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd",
      })
      .ele("soapenv:Body")
        .ele("sum:RegFactuSistemaFacturacion")
          .ele("sum:Cabecera")
            .ele("sum:ObligadoEmision")
              .ele("sum:NombreRazon").txt(company.legalName ?? company.name).up()
              .ele("sum:NIF").txt(company.cif ?? "").up()
            .up()
          .up()
          .ele("sum:RegistroFactura")
            .ele("sum:RegistroAlta")
              .ele("sum:IDVersion").txt("1.0").up()
              .ele("sum:IDFactura")
                .ele("sum:IDEmisorFactura").txt(company.cif ?? "").up()
                .ele("sum:NumSerieFactura").txt(invoice.number).up()
                .ele("sum:FechaExpedicionFactura").txt(
                  new Date(invoice.issueDate).toLocaleDateString("es-ES")
                ).up()
              .up()
              .ele("sum:NombreRazonEmisor").txt(company.legalName ?? company.name).up()
              .ele("sum:TipoFactura").txt("F1").up()
              .ele("sum:DescripcionOperacion").txt(
                invoice.items.map((i: any) => i.description).join(", ").slice(0, 500)
              ).up()
              .ele("sum:Destinatarios")
                .ele("sum:IDDestinatario")
                  .ele("sum:NombreRazon").txt(invoice.client.legalName ?? invoice.client.name).up()
                  .ele("sum:NIF").txt(invoice.client.cifNif ?? "").up()
                .up()
              .up()
              .ele("sum:Desglose")
                .ele("sum:DetalleIVA")
                  .ele("sum:TipoImpositivo").txt("21.00").up()
                  .ele("sum:BaseImponibleOImporteNoSujeto").txt(String(Number(invoice.subtotal).toFixed(2))).up()
                  .ele("sum:CuotaRepercutida").txt(String(Number(invoice.taxAmount).toFixed(2))).up()
                .up()
              .up()
              .ele("sum:CuotaTotal").txt(String(Number(invoice.taxAmount).toFixed(2))).up()
              .ele("sum:ImporteTotal").txt(String(Number(invoice.total).toFixed(2))).up()
            .up()
          .up()
        .up()
      .up()
    .up();

    return root.end({ prettyPrint: false });
  }

  private buildHashInput(invoice: any, previousHash?: string | null): string {
    const issueDate = new Date(invoice.issueDate);
    const parts = [
      invoice.company?.cif ?? "",
      invoice.number,
      `${issueDate.getDate().toString().padStart(2, "0")}-${(issueDate.getMonth() + 1).toString().padStart(2, "0")}-${issueDate.getFullYear()}`,
      Number(invoice.total).toFixed(2),
      previousHash ?? "",
    ];
    return parts.join("&");
  }

  private buildQrContent(nif: string, series: string, total: number, date: Date): string {
    const d = new Date(date);
    return `https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=${nif}&numserie=${encodeURIComponent(series)}&fecha=${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}&importe=${total.toFixed(2)}`;
  }

  async getStatus(companyId: string, invoiceId: string) {
    return this.prisma.verifactuRecord.findFirst({
      where: { companyId, invoiceId },
      include: { events: { orderBy: { createdAt: "desc" } } },
    });
  }
}
