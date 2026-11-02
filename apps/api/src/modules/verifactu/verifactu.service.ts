import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import * as https from "https";
import { Prisma } from "@saas/database";
import { PrismaService } from "../../database/prisma.service";
import {
  AltaData, DEFAULT_WAIT_SECONDS, Destinatario, LineaDesglose, MAX_RECORDS_PER_SUBMISSION, RegistroAnterior,
  buildEnvelope, buildQrUrl, buildRegistroAlta, buildRegistroAnulacion, formatFecha, formatFechaHoraHuso,
  formatImporte, huellaAlta, huellaAnulacion, parseRespuesta,
} from "./verifactu-xml";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const forge: any = require("node-forge");

// Puertos del WSDL oficial (SistemaFacturacion.wsdl) para certificados de persona física o representante;
// www10/prewww10 son solo para certificados de sello
const AEAT_ENDPOINTS = {
  test: "https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP",
  prod: "https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP",
};

// Registros de la cadena VERI*FACTU actual; los de chain = 1 son anteriores y no se envían
const CHAIN = 2;

// Espera tras un fallo técnico: 1, 2, 5, 15 y 30 minutos; después, cada hora
const RETRY_DELAYS_MIN = [1, 2, 5, 15, 30, 60];

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "GR", "FI", "FR", "HR", "HU", "IE", "IT",
  "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
]);

type Tx = Prisma.TransactionClient;

@Injectable()
export class VerifactuService {
  private readonly logger = new Logger(VerifactuService.name);

  constructor(private prisma: PrismaService) {}

  private aeatEnv(): "test" | "prod" {
    return (process.env.AEAT_ENV ?? "test").toLowerCase() === "prod" ? "prod" : "test";
  }

  // ── Activación ───────────────────────────────────────────────────────────

  private endOfYear(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 1));
  }

  async getSettings(companyId: string) {
    const [sender, pending, rejected] = await Promise.all([
      this.prisma.verifactuSender.findUnique({ where: { companyId } }),
      this.prisma.verifactuRecord.count({ where: { companyId, chain: CHAIN, status: "GENERATED" } }),
      this.prisma.verifactuRecord.count({ where: { companyId, chain: CHAIN, status: "REJECTED" } }),
    ]);
    // La opción por VERI*FACTU dura al menos hasta el fin del año natural del primer envío
    const lockedUntil = sender?.firstSentAt ? this.endOfYear(sender.firstSentAt) : null;
    return {
      enabled: sender?.enabled ?? false,
      activatedAt: sender?.activatedAt ?? null,
      firstSentAt: sender?.firstSentAt ?? null,
      lastSentAt: sender?.lastSentAt ?? null,
      lockedUntil,
      canDisable: !lockedUntil || lockedUntil <= new Date(),
      environment: this.aeatEnv(),
      pending,
      rejected,
    };
  }

  async setEnabled(companyId: string, enabled: boolean) {
    if (enabled) {
      const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
      if (!company.cif) throw new BadRequestException("Añade el NIF de la empresa en Empresa → Configuración antes de activar VERI*FACTU.");
      if (!(company.settings as any)?.verifactuCert?.data) {
        throw new BadRequestException("Sube el certificado digital de la empresa antes de activar VERI*FACTU.");
      }
      await this.prisma.verifactuSender.upsert({
        where: { companyId },
        create: { companyId, enabled: true, activatedAt: new Date() },
        update: { enabled: true, activatedAt: new Date() },
      });
    } else {
      const settings = await this.getSettings(companyId);
      if (!settings.canDisable) {
        throw new BadRequestException(
          `VERI*FACTU no se puede desactivar hasta el ${settings.lockedUntil!.toLocaleDateString("es-ES")}: la ley obliga a mantenerlo hasta el fin del año del primer envío.`,
        );
      }
      await this.prisma.verifactuSender.updateMany({ where: { companyId }, data: { enabled: false } });
    }
    return this.getSettings(companyId);
  }

  private async isEnabled(companyId: string): Promise<boolean> {
    const sender = await this.prisma.verifactuSender.findUnique({ where: { companyId } });
    return !!sender?.enabled;
  }

  // ── Datos del registro de alta ─────────────────────────────────────────────

  private loadInvoice(companyId: string, invoiceId: string) {
    return this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { client: true, items: { orderBy: { order: "asc" } }, taxes: true, company: true },
    });
  }

  private normalizeNif(raw: string | null | undefined): string {
    return (raw ?? "").toUpperCase().replace(/[\s.\-/]/g, "").replace(/^ES(?=[0-9A-Z]{9}$)/, "");
  }

  private destinatario(client: any): Destinatario {
    const nombre = client.legalName || client.name;
    const country = /^[A-Z]{2}$/.test((client.country ?? "").toUpperCase()) ? client.country.toUpperCase() : "ES";
    if (country === "ES") {
      const nif = this.normalizeNif(client.cifNif);
      if (!/^[0-9A-Z]{9}$/.test(nif)) {
        throw new BadRequestException(`El cliente "${nombre}" no tiene un NIF válido. Añádelo en su ficha antes de emitir la factura.`);
      }
      return { nombre, nif };
    }
    const id = (client.cifNif ?? "").replace(/\s/g, "");
    if (!id) {
      throw new BadRequestException(`El cliente "${nombre}" no tiene número de identificación fiscal. Añádelo en su ficha antes de emitir la factura.`);
    }
    return { nombre, idOtro: { codigoPais: country, idType: EU_COUNTRIES.has(country) ? "02" : "04", id } };
  }

  /** Comprueba la factura y devuelve los datos del alta (sin encadenar). Lanza un error claro si falta algo. */
  private altaFields(invoice: NonNullable<Awaited<ReturnType<VerifactuService["loadInvoice"]>>>) {
    const nif = this.normalizeNif(invoice.company.cif);
    if (!/^[0-9A-Z]{9}$/.test(nif)) throw new BadRequestException("El NIF de la empresa no es válido. Revísalo en Empresa → Configuración.");
    if ((invoice.currency ?? "EUR") !== "EUR") {
      throw new BadRequestException("Con VERI*FACTU activado, las facturas deben emitirse en euros.");
    }
    if (invoice.issueDate.getTime() > Date.now() + 60_000) {
      throw new BadRequestException("La fecha de la factura no puede ser posterior a hoy.");
    }

    // IVA agrupado por tipo; las retenciones (tipo negativo) no forman parte del registro
    const byRate = new Map<number, LineaDesglose>();
    const taxes = invoice.taxes.length
      ? invoice.taxes.map((t) => ({ rate: Number(t.rate), base: Number(t.base), amount: Number(t.amount) }))
      : [{
          rate: Number(invoice.subtotal) ? Math.round((Number(invoice.taxAmount) / Number(invoice.subtotal)) * 10000) / 100 : 0,
          base: Number(invoice.subtotal), amount: Number(invoice.taxAmount),
        }];
    for (const t of taxes) {
      if (t.rate < 0) continue;
      const line = byRate.get(t.rate) ?? { tipoImpositivo: t.rate, base: 0, cuota: 0 };
      line.base += t.base;
      line.cuota += t.rate > 0 ? t.amount : 0;
      byRate.set(t.rate, line);
    }
    if (byRate.size === 0) byRate.set(0, { tipoImpositivo: 0, base: Number(invoice.subtotal), cuota: 0 });
    if (byRate.size > 12) throw new BadRequestException("Una factura VERI*FACTU admite como máximo 12 tipos de IVA distintos.");
    const desglose = [...byRate.values()];
    const cuota = desglose.reduce((s, l) => s + l.cuota, 0);
    const base = desglose.reduce((s, l) => s + l.base, 0);

    return {
      idEmisor: nif,
      nombreEmisor: invoice.company.legalName || invoice.company.name,
      numSerie: invoice.number,
      fechaExpedicion: formatFecha(invoice.issueDate),
      tipoFactura: "F1" as const,
      descripcion: invoice.items.map((i) => i.description).join(", "),
      destinatario: this.destinatario(invoice.client),
      desglose,
      cuotaTotal: formatImporte(cuota),
      importeTotal: formatImporte(base + cuota),
    };
  }

  /** Lanza un error si, con VERI*FACTU activado, la factura no se puede registrar al emitirla. */
  async assertCanIssue(companyId: string, invoiceId: string) {
    if (!(await this.isEnabled(companyId))) return;
    const invoice = await this.loadInvoice(companyId, invoiceId);
    if (!invoice) throw new BadRequestException("Factura no encontrada");
    this.altaFields(invoice);
  }

  // ── Cadena de registros ────────────────────────────────────────────────────

  /** Crea un registro al final de la cadena de la empresa, en exclusiva para que no se crucen dos altas. */
  private async appendToChain<T>(
    companyId: string,
    build: (tx: Tx, anterior: RegistroAnterior | null, seq: number, fechaHoraHuso: string) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"verifactu:" + companyId}))`;
      const last = await tx.verifactuRecord.findFirst({
        where: { companyId, chain: CHAIN },
        orderBy: { seq: "desc" },
      });
      const anterior = last
        ? { idEmisor: last.issuerNif!, numSerie: last.numSerie!, fechaExpedicion: last.fechaExpedicion!, huella: last.hash }
        : null;
      return build(tx, anterior, (last?.seq ?? 0) + 1, formatFechaHoraHuso(new Date()));
    });
  }

  private latestForInvoice(companyId: string, invoiceId: string, tx: Tx | PrismaService = this.prisma) {
    return tx.verifactuRecord.findFirst({
      where: { companyId, invoiceId, chain: CHAIN },
      orderBy: { seq: "desc" },
    });
  }

  private async createAlta(companyId: string, invoiceId: string, opts: { subsanacion?: boolean; rechazoPrevio?: "X" } = {}) {
    const invoice = await this.loadInvoice(companyId, invoiceId);
    if (!invoice) throw new BadRequestException("Factura no encontrada");
    const fields = this.altaFields(invoice);

    return this.appendToChain(companyId, async (tx, anterior, seq, fechaHoraHuso) => {
      const hash = huellaAlta({ ...fields, huellaAnterior: anterior?.huella ?? null, fechaHoraHuso });
      const data: AltaData = {
        ...fields, anterior, numeroInstalacion: companyId, fechaHoraHuso, huella: hash, ...opts,
      };
      const record = await tx.verifactuRecord.create({
        data: {
          companyId, invoiceId, kind: "ALTA", chain: CHAIN, seq,
          xml: buildRegistroAlta(data), hash, previousHash: anterior?.huella ?? null,
          issuerNif: fields.idEmisor, numSerie: fields.numSerie, fechaExpedicion: fields.fechaExpedicion, fechaHoraHuso,
          status: "GENERATED",
          qrCode: buildQrUrl(this.aeatEnv(), fields.idEmisor, fields.numSerie, fields.fechaExpedicion, fields.importeTotal),
        },
      });
      await tx.verifactuEvent.create({
        data: {
          recordId: record.id, status: "GENERATED",
          message: opts.subsanacion ? "Registro de subsanación generado" : "Registro de alta generado",
        },
      });
      return record;
    });
  }

  private async createAnulacion(companyId: string, invoiceId: string, opts: { sinRegistroPrevio?: boolean; rechazoPrevio?: boolean }) {
    const alta = await this.prisma.verifactuRecord.findFirst({
      where: { companyId, invoiceId, chain: CHAIN, kind: "ALTA" },
      orderBy: { seq: "desc" },
    });
    if (!alta) return null;
    return this.appendToChain(companyId, async (tx, anterior, seq, fechaHoraHuso) => {
      const id = { idEmisor: alta.issuerNif!, numSerie: alta.numSerie!, fechaExpedicion: alta.fechaExpedicion! };
      const hash = huellaAnulacion({ ...id, huellaAnterior: anterior?.huella ?? null, fechaHoraHuso });
      const record = await tx.verifactuRecord.create({
        data: {
          companyId, invoiceId, kind: "ANULACION", chain: CHAIN, seq,
          xml: buildRegistroAnulacion({ ...id, ...opts, anterior, numeroInstalacion: companyId, fechaHoraHuso, huella: hash }),
          hash, previousHash: anterior?.huella ?? null,
          issuerNif: id.idEmisor, numSerie: id.numSerie, fechaExpedicion: id.fechaExpedicion, fechaHoraHuso,
          status: "GENERATED",
          // La factura conserva el QR de su alta
          qrCode: alta.qrCode,
        },
      });
      await tx.verifactuEvent.create({ data: { recordId: record.id, status: "GENERATED", message: "Registro de anulación generado" } });
      return record;
    });
  }

  /** Al emitir una factura (sale de borrador) se genera su registro de alta. */
  async onInvoiceIssued(companyId: string, invoiceId: string) {
    if (!(await this.isEnabled(companyId))) return null;
    const latest = await this.latestForInvoice(companyId, invoiceId);
    if (latest) return latest;
    return this.createAlta(companyId, invoiceId);
  }

  /** Al cancelar una factura con registro de alta se genera su registro de anulación. */
  async onInvoiceCancelled(companyId: string, invoiceId: string) {
    const latest = await this.latestForInvoice(companyId, invoiceId);
    if (!latest || latest.kind === "ANULACION") return latest;
    const everAccepted = await this.prisma.verifactuRecord.count({
      where: { companyId, invoiceId, chain: CHAIN, kind: "ALTA", status: "ACCEPTED" },
    });
    // Un alta pendiente se enviará antes que la anulación; una rechazada nunca llegó a la AEAT
    return this.createAnulacion(companyId, invoiceId, { sinRegistroPrevio: latest.status === "REJECTED" && !everAccepted });
  }

  async hasRecords(companyId: string, invoiceId: string) {
    return (await this.prisma.verifactuRecord.count({ where: { companyId, invoiceId, chain: CHAIN } })) > 0;
  }

  /** Corrige un registro rechazado con los datos actuales (p. ej., tras arreglar el NIF del cliente). */
  async resubmit(companyId: string, recordId: string) {
    const record = await this.prisma.verifactuRecord.findFirst({ where: { id: recordId, companyId, chain: CHAIN } });
    if (!record) throw new BadRequestException("Registro VeriFactu no encontrado");
    if (record.status !== "REJECTED") throw new BadRequestException("Solo se pueden corregir registros rechazados por la AEAT");
    const latest = await this.latestForInvoice(companyId, record.invoiceId);
    if (latest?.id !== record.id) throw new BadRequestException("Esta factura ya tiene un registro posterior");

    if (record.kind === "ANULACION") {
      return this.createAnulacion(companyId, record.invoiceId, { rechazoPrevio: true });
    }
    const everAccepted = await this.prisma.verifactuRecord.count({
      where: { companyId, invoiceId: record.invoiceId, chain: CHAIN, kind: "ALTA", status: "ACCEPTED" },
    });
    return this.createAlta(companyId, record.invoiceId, everAccepted ? { subsanacion: true } : { subsanacion: true, rechazoPrevio: "X" });
  }

  // ── Envío a la AEAT ──────────────────────────────────────────────────────

  private sending = false;

  /** Envía los registros pendientes de cada empresa respetando el control de flujo de la AEAT. */
  async processQueue() {
    if (this.sending) return;
    this.sending = true;
    try {
      const now = new Date();
      const senders = await this.prisma.verifactuSender.findMany({ where: { enabled: true } });
      for (const sender of senders) {
        const due = { companyId: sender.companyId, chain: CHAIN, status: "GENERATED" as const, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] };
        const pending = await this.prisma.verifactuRecord.count({ where: due });
        if (!pending) continue;
        const waited = !sender.lastSentAt || now.getTime() - sender.lastSentAt.getTime() >= sender.waitSeconds * 1000;
        if (!waited && pending < MAX_RECORDS_PER_SUBMISSION) continue;
        try {
          await this.sendBatch(sender.companyId, due);
        } catch (err: any) {
          this.logger.error(`[VeriFactu] Envío de ${sender.companyId} fallido: ${err?.message}`);
        }
      }
    } finally {
      this.sending = false;
    }
  }

  private async sendBatch(companyId: string, due: Prisma.VerifactuRecordWhereInput) {
    const candidates = await this.prisma.verifactuRecord.findMany({
      where: due, orderBy: { seq: "asc" }, take: MAX_RECORDS_PER_SUBMISSION,
    });
    // Una anulación no viaja en el mismo envío que el alta de su factura
    const batch: typeof candidates = [];
    const altas = new Set<string>();
    for (const r of candidates) {
      if (r.kind === "ANULACION" && altas.has(r.numSerie!)) break;
      if (r.kind === "ALTA") altas.add(r.numSerie!);
      batch.push(r);
    }

    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    let cert: { pfxBuffer: Buffer; password: string };
    try {
      cert = await this.getCertMaterial(companyId);
    } catch (err: any) {
      await this.markRetry(batch, err?.message ?? "No hay certificado digital", 60);
      return;
    }

    const envelope = buildEnvelope(
      { nombre: company.legalName || company.name, nif: batch[0]!.issuerNif! },
      batch.map((r) => ({ kind: r.kind, xml: r.xml })),
      batch.some((r) => r.attempts > 0),
    );
    this.logger.log(`[VeriFactu] Enviando ${batch.length} registro(s) de ${companyId} a ${this.aeatEndpoint()}`);

    let responseXml: string;
    try {
      responseXml = await this.postSoap(envelope, cert.pfxBuffer, cert.password);
    } catch (err: any) {
      await this.markRetry(batch, `No se pudo enviar a la AEAT: ${err?.message ?? err}`);
      return;
    }

    const res = parseRespuesta(responseXml);
    const sentAt = new Date();
    if (res.fault || res.lineas.length === 0) {
      // Mensaje rechazado entero (formato o servicio): los registros no constan en la AEAT, se reintentan
      await this.markRetry(batch, `La AEAT rechazó el envío: ${res.fault ?? "respuesta sin registros"}`, undefined, responseXml);
      return;
    }

    await this.prisma.verifactuSender.update({
      where: { companyId },
      data: { lastSentAt: sentAt, waitSeconds: res.tiempoEsperaEnvio ?? DEFAULT_WAIT_SECONDS },
    });

    const lineas = [...res.lineas];
    let anyAccepted = false;
    for (const r of batch) {
      const op = r.kind === "ALTA" ? "Alta" : "Anulacion";
      const idx = lineas.findIndex((l) => l.numSerie === r.numSerie && (!l.operacion || l.operacion === op));
      if (idx < 0) {
        await this.markRetry([r], "La AEAT no devolvió el resultado de este registro");
        continue;
      }
      const l = lineas.splice(idx, 1)[0]!;
      const duplicateOk = l.estadoRegistroDuplicado
        ? (r.kind === "ALTA" ? ["Correcta", "AceptadaConErrores"] : ["Anulada"]).includes(l.estadoRegistroDuplicado)
        : false;
      const accepted = l.estadoRegistro === "Correcto" || l.estadoRegistro === "AceptadoConErrores" || duplicateOk;
      anyAccepted ||= accepted;
      const error = l.descripcionError ? `${l.codigoError ? `${l.codigoError}: ` : ""}${l.descripcionError}` : null;

      await this.prisma.verifactuRecord.update({
        where: { id: r.id },
        data: {
          status: accepted ? "ACCEPTED" : "REJECTED",
          estadoRegistro: duplicateOk ? `Duplicado (${l.estadoRegistroDuplicado})` : l.estadoRegistro,
          errorCode: l.codigoError, lastError: error, csv: res.csv, aeatResponse: responseXml,
          sentAt, acceptedAt: accepted ? sentAt : null, nextAttemptAt: null, attempts: { increment: 1 },
        },
      });
      await this.prisma.verifactuEvent.create({
        data: {
          recordId: r.id, status: accepted ? "ACCEPTED" : "REJECTED",
          message: accepted
            ? `${l.estadoRegistro === "AceptadoConErrores" ? "Aceptado con errores" : "Aceptado"} por la AEAT. CSV: ${res.csv ?? "—"}${error ? ` · ${error}` : ""}`
            : `Rechazado por la AEAT: ${error ?? l.estadoRegistro}`,
        },
      });
    }
    if (anyAccepted) {
      await this.prisma.verifactuSender.updateMany({ where: { companyId, firstSentAt: null }, data: { firstSentAt: sentAt } });
    }
  }

  private async markRetry(records: { id: string; attempts: number }[], message: string, minutes?: number, response?: string) {
    for (const r of records) {
      const delay = minutes ?? RETRY_DELAYS_MIN[Math.min(r.attempts, RETRY_DELAYS_MIN.length - 1)]!;
      await this.prisma.verifactuRecord.update({
        where: { id: r.id },
        data: {
          attempts: { increment: 1 }, lastError: message, nextAttemptAt: new Date(Date.now() + delay * 60_000),
          ...(response ? { aeatResponse: response } : {}),
        },
      });
      await this.prisma.verifactuEvent.create({ data: { recordId: r.id, status: "GENERATED", message: `${message}. Nuevo intento en ${delay} min.` } });
    }
  }

  /** Adelanta el siguiente intento de los registros pendientes (p. ej., tras renovar el certificado). */
  async retryNow(companyId: string) {
    const { count } = await this.prisma.verifactuRecord.updateMany({
      where: { companyId, chain: CHAIN, status: "GENERATED" },
      data: { nextAttemptAt: null },
    });
    return { scheduled: count };
  }

  private aeatEndpoint(): string {
    return AEAT_ENDPOINTS[this.aeatEnv()];
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
            "SOAPAction": "",
            "Content-Length": body.length,
          },
          agent,
          timeout: 60_000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (d: Buffer) => chunks.push(d));
          res.on("end", () => {
            const xml = Buffer.concat(chunks).toString("utf8");
            const status = res.statusCode ?? 0;
            const location = String(res.headers.location ?? "");
            if (status >= 300 && status < 400) {
              // La AEAT redirige a su página de error cuando no acepta el certificado (erro4011)
              reject(new Error(/erro401/.test(location)
                ? "la AEAT no reconoce el certificado digital. Comprueba que es un certificado válido de la empresa o de su representante"
                : `redirección inesperada (HTTP ${status})`));
            } else if (status >= 400 && !/Fault/.test(xml)) {
              // Un SOAP Fault llega con HTTP 500 y se trata como respuesta
              reject(new Error(`HTTP ${status}`));
            } else if (!xml.trim()) {
              reject(new Error(`respuesta vacía (HTTP ${status})`));
            } else {
              resolve(xml);
            }
          });
        },
      );
      req.on("timeout", () => req.destroy(new Error("tiempo de espera agotado")));
      req.on("error", reject);
      req.write(body);
      req.end();
    });
  }

  // ── Consultas ────────────────────────────────────────────────────────────

  async getStatus(companyId: string, invoiceId: string) {
    return this.prisma.verifactuRecord.findFirst({
      where: { companyId, invoiceId, chain: CHAIN },
      orderBy: { seq: "desc" },
      include: { events: { orderBy: { createdAt: "desc" } } },
    });
  }

  async getAll(companyId: string) {
    const records = await this.prisma.verifactuRecord.findMany({
      where: { companyId, chain: CHAIN },
      include: {
        invoice: { select: { number: true, total: true, issueDate: true, client: { select: { id: true, name: true } } } },
        events: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { seq: "desc" },
    });
    const latestIds = new Set<string>();
    const seen = new Set<string>();
    for (const r of records) {
      if (!seen.has(r.invoiceId)) { seen.add(r.invoiceId); latestIds.add(r.id); }
    }
    const count = (s: string) => records.filter((r) => r.status === s).length;
    return {
      records: records.map(({ xml: _xml, aeatResponse: _resp, ...r }) => ({ ...r, isLatest: latestIds.has(r.id) })),
      stats: { total: records.length, pending: count("GENERATED"), accepted: count("ACCEPTED"), rejected: count("REJECTED") },
    };
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

    // Los envíos que esperaban un certificado se reintentan ya
    await this.retryNow(companyId);

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
    if (await this.isEnabled(companyId)) {
      throw new BadRequestException("Con VERI*FACTU activado no se puede quitar el certificado. Sube uno nuevo para sustituirlo.");
    }
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const { verifactuCert: _removed, ...rest } = (company.settings ?? {}) as any;
    await this.prisma.company.update({ where: { id: companyId }, data: { settings: rest } });
    return { deleted: true };
  }

  // ── Certificate material extraction ─────────────────────────────────────

  private async getCertMaterial(companyId: string): Promise<{ pfxBuffer: Buffer; password: string }> {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const s = (company.settings ?? {}) as any;
    const vc = s?.verifactuCert;
    if (!vc?.data) throw new BadRequestException("No hay certificado digital configurado. Ve a VeriFactu → Certificado.");
    if (vc.expiresAt && new Date(vc.expiresAt) < new Date()) {
      throw new BadRequestException("El certificado digital está caducado. Sube uno nuevo en VeriFactu → Certificado.");
    }
    return { pfxBuffer: Buffer.from(this.decrypt(vc.data), "base64"), password: this.decrypt(vc.password) };
  }
}
