import { Injectable, BadRequestException } from "@nestjs/common";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { create } from "xmlbuilder2";
import { PrismaService } from "../../database/prisma.service";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const forge: any = require("node-forge");

@Injectable()
export class VerifactuService {
  constructor(private prisma: PrismaService) {}

  async generateForInvoice(companyId: string, invoiceId: string, silent = false) {
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

    if (!invoice) {
      if (silent) return null;
      throw new BadRequestException("Factura no encontrada");
    }
    if (!invoice.company?.cif) {
      if (silent) return null;
      throw new BadRequestException("La empresa no tiene CIF/NIF configurado. Ve a Empresa → Configuración para añadirlo.");
    }
    if ((invoice as any).verifactu) {
      if (silent) return (invoice as any).verifactu;
      throw new BadRequestException("VeriFactu ya generado para esta factura");
    }
    if (!["SENT", "PAID"].includes(invoice.status)) {
      if (silent) return null;
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
    const taxLines: { rate: number; base: number; amount: number }[] =
      (invoice.taxes as any[])?.length > 0
        ? (invoice.taxes as any[]).map((t) => ({
            rate: Number(t.rate),
            base: Number(t.base),
            amount: Number(t.amount),
          }))
        : [{ rate: 21, base: Number(invoice.subtotal), amount: Number(invoice.taxAmount) }];

    const desglose = create({ version: "1.0", encoding: "UTF-8" })
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
              .ele("sum:Desglose");

    for (const tax of taxLines) {
      desglose
        .ele("sum:DetalleIVA")
          .ele("sum:TipoImpositivo").txt(tax.rate.toFixed(2)).up()
          .ele("sum:BaseImponibleOImporteNoSujeto").txt(tax.base.toFixed(2)).up()
          .ele("sum:CuotaRepercutida").txt(tax.amount.toFixed(2)).up()
        .up();
    }

    desglose
      .up() // back to RegistroAlta
      .ele("sum:CuotaTotal").txt(Number(invoice.taxAmount).toFixed(2)).up()
      .ele("sum:ImporteTotal").txt(Number(invoice.total).toFixed(2)).up();

    return desglose.root().end({ prettyPrint: false });
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

  // ── Certificate management ───────────────────────────────────────────────

  private encKey(): Buffer {
    const raw = process.env.CERT_ENCRYPTION_KEY ?? "youwhole-dev-key-change-in-production!!";
    return createHash("sha256").update(raw).digest(); // always 32 bytes
  }

  private encrypt(plain: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", this.encKey(), iv);
    const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    return iv.toString("hex") + ":" + enc.toString("base64");
  }

  private decrypt(blob: string): string {
    const [ivHex, b64] = blob.split(":");
    const decipher = createDecipheriv("aes-256-cbc", this.encKey(), Buffer.from(ivHex!, "hex"));
    return Buffer.concat([decipher.update(Buffer.from(b64!, "base64")), decipher.final()]).toString("utf8");
  }

  async saveCertificate(companyId: string, certBuffer: Buffer, password: string) {
    let certSubject = "";
    let certNif = "";
    let certExpiresAt: Date = new Date(0);

    try {
      const p12Der = certBuffer.toString("binary");
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = bags[forge.pki.oids.certBag]?.[0];
      if (!certBag?.cert) throw new Error("Sin certificado en el archivo");

      const cert = certBag.cert;
      const cn: string = (cert.subject as any).getField("CN")?.value ?? "";
      const org: string = (cert.subject as any).getField("O")?.value ?? "";
      certSubject = org || cn;
      certExpiresAt = cert.validity.notAfter;

      // FNMT certs embed NIF/CIF after "NIF:" or "CIF:" in CN, or in SERIALNUMBER
      const nifInCn = cn.match(/(?:NIF|CIF|DNI)[:\s]+([A-Z0-9]{9})/i);
      if (nifInCn) {
        certNif = nifInCn[1]!;
      } else {
        const serial: string = (cert.subject as any).getField("SERIALNUMBER")?.value ?? "";
        if (serial) certNif = serial;
      }
    } catch {
      throw new BadRequestException(
        "No se pudo leer el certificado. Comprueba que el archivo .p12/.pfx y la contraseña son correctos."
      );
    }

    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const current = (company.settings ?? {}) as Record<string, unknown>;

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        settings: {
          ...current,
          verifactuCert: {
            data: this.encrypt(certBuffer.toString("base64")),
            password: this.encrypt(password),
            subject: certSubject,
            nif: certNif,
            expiresAt: certExpiresAt!.toISOString(),
            uploadedAt: new Date().toISOString(),
          },
        },
      },
    });

    return {
      subject: certSubject,
      nif: certNif,
      expiresAt: certExpiresAt!.toISOString(),
    };
  }

  async getCertificateInfo(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    const s = (company?.settings ?? {}) as any;
    const vc = s?.verifactuCert;
    if (!vc?.data) return null;

    const expiresAt = vc.expiresAt ? new Date(vc.expiresAt) : null;
    return {
      subject: vc.subject ?? "",
      nif: vc.nif ?? "",
      expiresAt: vc.expiresAt ?? null,
      uploadedAt: vc.uploadedAt ?? null,
      isExpired: expiresAt ? expiresAt < new Date() : false,
      daysLeft: expiresAt
        ? Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
        : null,
    };
  }

  async deleteCertificate(companyId: string) {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const { verifactuCert: _removed, ...rest } = (company.settings ?? {}) as any;
    await this.prisma.company.update({ where: { id: companyId }, data: { settings: rest } });
    return { deleted: true };
  }

  async getAll(companyId: string) {
    const records = await this.prisma.verifactuRecord.findMany({
      where: { companyId },
      include: {
        invoice: {
          include: {
            client: { select: { id: true, name: true } },
          },
        },
        events: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = records.length;
    const generated = records.filter((r) => r.status === "GENERATED").length;
    const sent = records.filter((r) => r.status === "SENT").length;
    const accepted = records.filter((r) => r.status === "ACCEPTED").length;

    return { records, stats: { total, generated, sent, accepted } };
  }
}
