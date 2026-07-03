import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { create } from "xmlbuilder2";
import * as https from "https";
import { SignedXml } from "xml-crypto";
import { PrismaService } from "../../database/prisma.service";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const forge: any = require("node-forge");

// AEAT VERI*FACTU SOAP endpoints (SuministroLR / SistemaFacturacion)
const AEAT_ENDPOINTS = {
  test: "https://prewww10.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP",
  prod: "https://www10.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP",
};

@Injectable()
export class VerifactuService {
  private readonly logger = new Logger(VerifactuService.name);

  constructor(private prisma: PrismaService) {}

  private aeatEndpoint(): string {
    const env = (process.env.AEAT_ENV ?? "test").toLowerCase();
    return env === "prod" ? AEAT_ENDPOINTS.prod : AEAT_ENDPOINTS.test;
  }

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

    const hashInput = this.buildHashInput(invoice, previousRecord?.hash);
    const hash = createHash("sha256").update(hashInput, "utf8").digest("hex").toUpperCase();
    const xml = this.buildXml(invoice, invoice.company, hash, previousRecord?.hash ?? null);

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

    await this.prisma.verifactuEvent.create({
      data: { recordId: record.id, status: "GENERATED", message: "Registro generado y huella calculada" },
    });

    return record;
  }

  private buildXml(invoice: any, company: any, hash: string, previousHash: string | null): string {
    const taxLines: { rate: number; base: number; amount: number }[] =
      (invoice.taxes as any[])?.length > 0
        ? (invoice.taxes as any[]).map((t) => ({
            rate: Number(t.rate),
            base: Number(t.base),
            amount: Number(t.amount),
          }))
        : [{ rate: 21, base: Number(invoice.subtotal), amount: Number(invoice.taxAmount) }];

    const issueDateStr = new Date(invoice.issueDate).toLocaleDateString("es-ES");
    const now = new Date();
    // ISO 8601 with timezone offset, e.g. 2026-06-29T12:00:00+02:00 (required by AEAT FechaHoraHusoGenRegistro)
    const tzOffsetMin = -now.getTimezoneOffset();
    const tzSign = tzOffsetMin >= 0 ? "+" : "-";
    const tzAbs = Math.abs(tzOffsetMin);
    const tzStr = `${tzSign}${String(Math.floor(tzAbs / 60)).padStart(2, "0")}:${String(tzAbs % 60).padStart(2, "0")}`;
    const fechaHoraHuso = `${now.toISOString().slice(0, 19)}${tzStr}`;

    const desglose = create({ version: "1.0", encoding: "UTF-8" })
      .ele("sum:RegistroFactura", {
        "xmlns:sum": "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd",
        "xmlns:sf": "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroLR.xsd",
      })
        .ele("sum:RegistroAlta")
          .ele("sf:IDVersion").txt("1.0").up()
          .ele("sf:IDFactura")
            .ele("sf:IDEmisorFactura").txt(company.cif ?? "").up()
            .ele("sf:NumSerieFactura").txt(invoice.number).up()
            .ele("sf:FechaExpedicionFactura").txt(issueDateStr).up()
          .up()
          .ele("sf:NombreRazonEmisor").txt(company.legalName ?? company.name).up()
          .ele("sf:TipoFactura").txt("F1").up()
          .ele("sf:DescripcionOperacion").txt(
            invoice.items.map((i: any) => i.description).join(", ").slice(0, 500)
          ).up()
          .ele("sf:Destinatarios")
            .ele("sf:IDDestinatario")
              .ele("sf:NombreRazon").txt(invoice.client.legalName ?? invoice.client.name).up()
              .ele("sf:NIF").txt(invoice.client.cifNif ?? "").up()
            .up()
          .up()
          .ele("sf:Desglose");

    for (const tax of taxLines) {
      desglose
        .ele("sf:DetalleIVA")
          .ele("sf:TipoImpositivo").txt(tax.rate.toFixed(2)).up()
          .ele("sf:BaseImponibleOImporteNoSujeto").txt(tax.base.toFixed(2)).up()
          .ele("sf:CuotaRepercutida").txt(tax.amount.toFixed(2)).up()
        .up();
    }

    const afterDesglose = desglose
      .up() // back to RegistroAlta
      .ele("sf:CuotaTotal").txt(Number(invoice.taxAmount).toFixed(2)).up()
      .ele("sf:ImporteTotal").txt(Number(invoice.total).toFixed(2)).up();

    // Encadenamiento: links this record to the previous one in the company's chain (or PrimerRegistro)
    if (previousHash) {
      afterDesglose
        .ele("sf:Encadenamiento")
          .ele("sf:RegistroAnterior")
            .ele("sf:IDEmisorFactura").txt(company.cif ?? "").up()
            .ele("sf:Huella").txt(previousHash).up()
          .up()
        .up();
    } else {
      afterDesglose.ele("sf:Encadenamiento").ele("sf:PrimerRegistro").txt("S").up().up();
    }

    afterDesglose
      .ele("sf:SistemaInformatico")
        .ele("sf:NombreRazon").txt("YouWhole").up()
        .ele("sf:NIF").txt(company.cif ?? "").up()
        .ele("sf:NombreSistemaInformatico").txt("YouWhole ERP").up()
        .ele("sf:IdSistemaInformatico").txt("01").up()
        .ele("sf:Version").txt("1.0").up()
        .ele("sf:NumeroInstalacion").txt(company.id ?? "1").up()
        .ele("sf:TipoUsoPosibleSoloVerifactu").txt("S").up()
        .ele("sf:TipoUsoPosibleMultiOT").txt("N").up()
        .ele("sf:IndicadorMultiplesOT").txt("N").up()
      .up()
      .ele("sf:FechaHoraHusoGenRegistro").txt(fechaHoraHuso).up()
      .ele("sf:TipoHuella").txt("01").up()
      .ele("sf:Huella").txt(hash).up();

    return desglose.root().end({ prettyPrint: false });
  }

  // ── XAdES-BES signing ─────────────────────────────────────────────────────

  private signRegistroXml(xml: string, certPem: string, keyPem: string): string {
    const sig = new SignedXml({
      privateKey: keyPem,
      publicCert: certPem,
      signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
      canonicalizationAlgorithm: "http://www.w3.org/2001/10/xml-exc-c14n#",
    });
    sig.addReference({
      xpath: "//*[local-name(.)='RegistroAlta']",
      digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
      transforms: [
        "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
        "http://www.w3.org/2001/10/xml-exc-c14n#",
      ],
    });
    sig.getKeyInfoContent = () => {
      const certClean = certPem.replace(/-----BEGIN CERTIFICATE-----/, "").replace(/-----END CERTIFICATE-----/, "").replace(/\r?\n/g, "");
      return `<X509Data><X509Certificate>${certClean}</X509Certificate></X509Data>`;
    };
    sig.computeSignature(xml, { location: { reference: "//*[local-name(.)='RegistroFactura']", action: "append" } });
    return sig.getSignedXml();
  }

  private buildSoapEnvelope(signedRegistro: string, company: any): string {
    return create({ version: "1.0", encoding: "UTF-8" })
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
        .up() // RegFactuSistemaFacturacion (registro inserted via raw XML below)
      .up()
      .root()
      .end({ prettyPrint: false })
      // Inject the signed RegistroFactura right before the closing tag of RegFactuSistemaFacturacion
      .replace("</sum:RegFactuSistemaFacturacion>", `${signedRegistro}</sum:RegFactuSistemaFacturacion>`);
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
    const raw = process.env.CERT_ENCRYPTION_KEY;
    if (!raw) throw new Error("CERT_ENCRYPTION_KEY env var is required for certificate encryption");
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

  // ── Certificate material extraction ─────────────────────────────────────

  private async getCertMaterial(companyId: string): Promise<{
    certPem: string;
    keyPem: string;
    pfxBuffer: Buffer;
    password: string;
  }> {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const s = (company.settings ?? {}) as any;
    const vc = s?.verifactuCert;
    if (!vc?.data) throw new BadRequestException("No hay certificado digital configurado. Ve a VeriFactu → Certificado.");

    const password = this.decrypt(vc.password);
    const pfxB64 = this.decrypt(vc.data);
    const pfxBuffer = Buffer.from(pfxB64, "base64");

    const p12Der = pfxBuffer.toString("binary");
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert;
    if (!cert) throw new BadRequestException("No se pudo extraer el certificado del archivo .p12");

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;
    if (!privateKey) throw new BadRequestException("No se pudo extraer la clave privada del certificado");

    return {
      certPem: forge.pki.certificateToPem(cert),
      keyPem: forge.pki.privateKeyToPem(privateKey),
      pfxBuffer,
      password,
    };
  }

  // ── Send to AEAT ──────────────────────────────────────────────────────────

  async sendToAeat(companyId: string, recordId: string) {
    const record = await this.prisma.verifactuRecord.findFirst({
      where: { id: recordId, companyId },
      include: { invoice: { include: { company: true } } },
    });
    if (!record) throw new BadRequestException("Registro VeriFactu no encontrado");
    if (record.status === "ACCEPTED") throw new BadRequestException("Este registro ya fue aceptado por AEAT");

    const { certPem, keyPem, pfxBuffer, password } = await this.getCertMaterial(companyId);
    const company = record.invoice.company;

    // Sign the stored RegistroFactura XML (sign at send time, not at generation time)
    const signedRegistro = this.signRegistroXml(record.xml, certPem, keyPem);
    const soapEnvelope = this.buildSoapEnvelope(signedRegistro, company);

    this.logger.log(`[VeriFactu] Sending record ${recordId} to AEAT ${this.aeatEndpoint()}`);

    let responseXml: string;
    try {
      responseXml = await this.postSoap(soapEnvelope, pfxBuffer, password);
    } catch (err: any) {
      await this.prisma.verifactuEvent.create({
        data: { recordId, status: "REJECTED", message: `Error de red: ${err.message}` },
      });
      throw new BadRequestException(`Error al conectar con AEAT: ${err.message}`);
    }

    // Parse AEAT response: EstadoEnvio (Correcto/AceptadoConErrores/Incorrecto), CSV, errors
    const estadoMatch = responseXml.match(/<[^:]*:?EstadoEnvio[^>]*>([^<]+)<\/[^>]+>/);
    const csvMatch = responseXml.match(/<[^:]*:?CSV[^>]*>([^<]+)<\/[^>]+>/);
    const errDescMatch = responseXml.match(/<[^:]*:?DescripcionErrorRegistro[^>]*>([^<]+)<\/[^>]+>/);

    const estado = estadoMatch?.[1]?.trim() ?? "Desconocido";
    const csv = csvMatch?.[1]?.trim() ?? null;
    const errDesc = errDescMatch?.[1]?.trim() ?? null;

    const accepted = estado === "Correcto" || estado === "AceptadoConErrores";
    const newStatus = accepted ? "ACCEPTED" : "REJECTED";

    await this.prisma.verifactuRecord.update({
      where: { id: recordId },
      data: {
        status: newStatus,
        aeatResponse: responseXml,
        ...(csv ? { csv } : {}),
        sentAt: new Date(),
      },
    });

    await this.prisma.verifactuEvent.create({
      data: {
        recordId,
        status: newStatus,
        message: accepted
          ? `Aceptado por AEAT. CSV: ${csv ?? "N/A"}`
          : `Rechazado por AEAT: ${errDesc ?? estado}`,
      },
    });

    return { status: newStatus, estado, csv, error: errDesc };
  }

  private postSoap(envelope: string, pfxBuffer: Buffer, passphrase: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = Buffer.from(envelope, "utf8");
      const url = new URL(this.aeatEndpoint());
      const agent = new https.Agent({ pfx: pfxBuffer, passphrase, rejectUnauthorized: true });

      const req = https.request(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname,
          method: "POST",
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": "RegFactuSistemaFacturacion",
            "Content-Length": body.length,
          },
          agent,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (d: Buffer) => chunks.push(d));
          res.on("end", () => {
            const xml = Buffer.concat(chunks).toString("utf8");
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`AEAT HTTP ${res.statusCode}: ${xml.slice(0, 300)}`));
            } else {
              resolve(xml);
            }
          });
        }
      );
      req.on("error", reject);
      req.write(body);
      req.end();
    });
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
