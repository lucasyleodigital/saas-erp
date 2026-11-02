// Registros VERI*FACTU según la documentación de la AEAT:
// - Huella: "Detalle de las especificaciones técnicas para la generación de la huella o hash" (v0.1.2)
// - XML: "Veri-Factu_Descripcion_SWeb" (v1.0.3) y los esquemas SuministroLR.xsd / SuministroInformacion.xsd
import { createHash } from "crypto";
import { create } from "xmlbuilder2";

export const NS_LR =
  "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroLR.xsd";
export const NS_INFO =
  "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd";

// Datos del productor del sistema. Si cambian, hay que publicar una declaración responsable nueva
// (apps/web/src/lib/verifactu-declaration.ts lleva los mismos valores).
export const SISTEMA_INFORMATICO = {
  nombreRazon: "Alex Lucas Torrubia",
  nif: "41003566V",
  nombreSistema: "YouWhole",
  idSistema: "YW",
  version: "1.0",
  tipoUsoPosibleSoloVerifactu: "S",
  tipoUsoPosibleMultiOT: "S",
  // Cada empresa es una instalación propia (NumeroInstalacion = id de la empresa)
  indicadorMultiplesOT: "N",
} as const;

// Control de flujo inicial (art. 16.2 de la Orden HAC/1177/2024) y tamaño máximo de un envío
export const DEFAULT_WAIT_SECONDS = 60;
export const MAX_RECORDS_PER_SUBMISSION = 1000;

const TZ = "Europe/Madrid";

function madridParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour"), mm: get("minute"), ss: get("second") };
}

/** Fecha en formato dd-mm-aaaa, en hora peninsular. */
export function formatFecha(date: Date): string {
  const p = madridParts(date);
  return `${p.d}-${p.m}-${p.y}`;
}

/** Fecha y hora con huso (ISO 8601), p. ej. 2024-01-01T19:20:30+01:00. */
export function formatFechaHoraHuso(date: Date): string {
  const p = madridParts(date);
  const wallAsUtc = Date.UTC(+p.y, +p.m - 1, +p.d, +p.hh, +p.mm, +p.ss);
  const offsetMin = Math.round((wallAsUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const off = `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
  return `${p.y}-${p.m}-${p.d}T${p.hh}:${p.mm}:${p.ss}${off}`;
}

export function formatImporte(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function sha256Upper(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex").toUpperCase();
}

const v = (s: string | null | undefined) => (s ?? "").trim();

export interface HuellaAltaInput {
  idEmisor: string;
  numSerie: string;
  fechaExpedicion: string;
  tipoFactura: string;
  cuotaTotal: string;
  importeTotal: string;
  huellaAnterior: string | null;
  fechaHoraHuso: string;
}

export function huellaAltaString(i: HuellaAltaInput): string {
  return [
    `IDEmisorFactura=${v(i.idEmisor)}`,
    `NumSerieFactura=${v(i.numSerie)}`,
    `FechaExpedicionFactura=${v(i.fechaExpedicion)}`,
    `TipoFactura=${v(i.tipoFactura)}`,
    `CuotaTotal=${v(i.cuotaTotal)}`,
    `ImporteTotal=${v(i.importeTotal)}`,
    `Huella=${v(i.huellaAnterior)}`,
    `FechaHoraHusoGenRegistro=${v(i.fechaHoraHuso)}`,
  ].join("&");
}

export function huellaAlta(i: HuellaAltaInput): string {
  return sha256Upper(huellaAltaString(i));
}

export interface HuellaAnulacionInput {
  idEmisor: string;
  numSerie: string;
  fechaExpedicion: string;
  huellaAnterior: string | null;
  fechaHoraHuso: string;
}

export function huellaAnulacionString(i: HuellaAnulacionInput): string {
  return [
    `IDEmisorFacturaAnulada=${v(i.idEmisor)}`,
    `NumSerieFacturaAnulada=${v(i.numSerie)}`,
    `FechaExpedicionFacturaAnulada=${v(i.fechaExpedicion)}`,
    `Huella=${v(i.huellaAnterior)}`,
    `FechaHoraHusoGenRegistro=${v(i.fechaHoraHuso)}`,
  ].join("&");
}

export function huellaAnulacion(i: HuellaAnulacionInput): string {
  return sha256Upper(huellaAnulacionString(i));
}

/** Registro inmediatamente anterior de la cadena (alta o anulación). */
export interface RegistroAnterior {
  idEmisor: string;
  numSerie: string;
  fechaExpedicion: string;
  huella: string;
}

export type Destinatario =
  | { nombre: string; nif: string }
  | { nombre: string; idOtro: { codigoPais: string; idType: string; id: string } };

export interface LineaDesglose {
  tipoImpositivo: number;
  base: number;
  cuota: number;
}

export interface AltaData {
  idEmisor: string;
  nombreEmisor: string;
  numSerie: string;
  fechaExpedicion: string;
  tipoFactura: "F1";
  descripcion: string;
  destinatario: Destinatario;
  desglose: LineaDesglose[];
  cuotaTotal: string;
  importeTotal: string;
  anterior: RegistroAnterior | null;
  numeroInstalacion: string;
  fechaHoraHuso: string;
  huella: string;
  subsanacion?: boolean;
  /** "X" cuando el alta inicial fue rechazada y aún no existe en la AEAT */
  rechazoPrevio?: "X";
}

export interface AnulacionData {
  idEmisor: string;
  numSerie: string;
  fechaExpedicion: string;
  /** El alta nunca llegó a registrarse en la AEAT */
  sinRegistroPrevio?: boolean;
  /** Una anulación anterior de la misma factura fue rechazada */
  rechazoPrevio?: boolean;
  anterior: RegistroAnterior | null;
  numeroInstalacion: string;
  fechaHoraHuso: string;
  huella: string;
}

const trunc = (s: string, max: number) => v(s).slice(0, max);

function appendEncadenamiento(parent: any, anterior: RegistroAnterior | null) {
  const enc = parent.ele("sum1:Encadenamiento");
  if (!anterior) {
    enc.ele("sum1:PrimerRegistro").txt("S");
    return;
  }
  const ra = enc.ele("sum1:RegistroAnterior");
  ra.ele("sum1:IDEmisorFactura").txt(anterior.idEmisor);
  ra.ele("sum1:NumSerieFactura").txt(anterior.numSerie);
  ra.ele("sum1:FechaExpedicionFactura").txt(anterior.fechaExpedicion);
  ra.ele("sum1:Huella").txt(anterior.huella);
}

function appendSistemaInformatico(parent: any, numeroInstalacion: string) {
  const si = parent.ele("sum1:SistemaInformatico");
  si.ele("sum1:NombreRazon").txt(SISTEMA_INFORMATICO.nombreRazon);
  si.ele("sum1:NIF").txt(SISTEMA_INFORMATICO.nif);
  si.ele("sum1:NombreSistemaInformatico").txt(SISTEMA_INFORMATICO.nombreSistema);
  si.ele("sum1:IdSistemaInformatico").txt(SISTEMA_INFORMATICO.idSistema);
  si.ele("sum1:Version").txt(SISTEMA_INFORMATICO.version);
  si.ele("sum1:NumeroInstalacion").txt(trunc(numeroInstalacion, 100));
  si.ele("sum1:TipoUsoPosibleSoloVerifactu").txt(SISTEMA_INFORMATICO.tipoUsoPosibleSoloVerifactu);
  si.ele("sum1:TipoUsoPosibleMultiOT").txt(SISTEMA_INFORMATICO.tipoUsoPosibleMultiOT);
  si.ele("sum1:IndicadorMultiplesOT").txt(SISTEMA_INFORMATICO.indicadorMultiplesOT);
}

/** Fragmento <sum1:RegistroAlta> listo para ir dentro de <sum:RegistroFactura>. */
export function buildRegistroAlta(d: AltaData): string {
  const doc = create().ele(NS_INFO, "sum1:RegistroAlta");
  doc.ele("sum1:IDVersion").txt("1.0");
  const id = doc.ele("sum1:IDFactura");
  id.ele("sum1:IDEmisorFactura").txt(d.idEmisor);
  id.ele("sum1:NumSerieFactura").txt(d.numSerie);
  id.ele("sum1:FechaExpedicionFactura").txt(d.fechaExpedicion);
  doc.ele("sum1:NombreRazonEmisor").txt(trunc(d.nombreEmisor, 120));
  if (d.subsanacion) doc.ele("sum1:Subsanacion").txt("S");
  if (d.rechazoPrevio) doc.ele("sum1:RechazoPrevio").txt(d.rechazoPrevio);
  doc.ele("sum1:TipoFactura").txt(d.tipoFactura);
  doc.ele("sum1:DescripcionOperacion").txt(trunc(d.descripcion, 500) || "Venta o prestación de servicios");

  const dest = doc.ele("sum1:Destinatarios").ele("sum1:IDDestinatario");
  dest.ele("sum1:NombreRazon").txt(trunc(d.destinatario.nombre, 120));
  if ("nif" in d.destinatario) {
    dest.ele("sum1:NIF").txt(d.destinatario.nif);
  } else {
    const otro = dest.ele("sum1:IDOtro");
    otro.ele("sum1:CodigoPais").txt(d.destinatario.idOtro.codigoPais);
    otro.ele("sum1:IDType").txt(d.destinatario.idOtro.idType);
    otro.ele("sum1:ID").txt(trunc(d.destinatario.idOtro.id, 20));
  }

  const desglose = doc.ele("sum1:Desglose");
  for (const l of d.desglose) {
    const det = desglose.ele("sum1:DetalleDesglose");
    det.ele("sum1:ClaveRegimen").txt("01");
    if (l.tipoImpositivo > 0) {
      det.ele("sum1:CalificacionOperacion").txt("S1");
      det.ele("sum1:TipoImpositivo").txt(formatImporte(l.tipoImpositivo));
      det.ele("sum1:BaseImponibleOimporteNoSujeto").txt(formatImporte(l.base));
      det.ele("sum1:CuotaRepercutida").txt(formatImporte(l.cuota));
    } else {
      // Sin IVA: exenta por el artículo 20 de la Ley del IVA
      det.ele("sum1:OperacionExenta").txt("E1");
      det.ele("sum1:BaseImponibleOimporteNoSujeto").txt(formatImporte(l.base));
    }
  }

  doc.ele("sum1:CuotaTotal").txt(d.cuotaTotal);
  doc.ele("sum1:ImporteTotal").txt(d.importeTotal);
  appendEncadenamiento(doc, d.anterior);
  appendSistemaInformatico(doc, d.numeroInstalacion);
  doc.ele("sum1:FechaHoraHusoGenRegistro").txt(d.fechaHoraHuso);
  doc.ele("sum1:TipoHuella").txt("01");
  doc.ele("sum1:Huella").txt(d.huella);
  return doc.end({ headless: true, prettyPrint: false });
}

/** Fragmento <sum1:RegistroAnulacion> listo para ir dentro de <sum:RegistroFactura>. */
export function buildRegistroAnulacion(d: AnulacionData): string {
  const doc = create().ele(NS_INFO, "sum1:RegistroAnulacion");
  doc.ele("sum1:IDVersion").txt("1.0");
  const id = doc.ele("sum1:IDFactura");
  id.ele("sum1:IDEmisorFacturaAnulada").txt(d.idEmisor);
  id.ele("sum1:NumSerieFacturaAnulada").txt(d.numSerie);
  id.ele("sum1:FechaExpedicionFacturaAnulada").txt(d.fechaExpedicion);
  if (d.sinRegistroPrevio) doc.ele("sum1:SinRegistroPrevio").txt("S");
  if (d.rechazoPrevio) doc.ele("sum1:RechazoPrevio").txt("S");
  appendEncadenamiento(doc, d.anterior);
  appendSistemaInformatico(doc, d.numeroInstalacion);
  doc.ele("sum1:FechaHoraHusoGenRegistro").txt(d.fechaHoraHuso);
  doc.ele("sum1:TipoHuella").txt("01");
  doc.ele("sum1:Huella").txt(d.huella);
  return doc.end({ headless: true, prettyPrint: false });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Sobre SOAP de RegFactuSistemaFacturacion con hasta 1.000 registros. */
export function buildEnvelope(
  obligado: { nombre: string; nif: string },
  registros: { kind: "ALTA" | "ANULACION"; xml: string }[],
  incidencia = false,
): string {
  if (registros.length === 0 || registros.length > MAX_RECORDS_PER_SUBMISSION) {
    throw new Error(`Un envío debe tener entre 1 y ${MAX_RECORDS_PER_SUBMISSION} registros`);
  }
  const cabecera =
    `<sum:Cabecera><sum1:ObligadoEmision>` +
    `<sum1:NombreRazon>${escapeXml(trunc(obligado.nombre, 120))}</sum1:NombreRazon>` +
    `<sum1:NIF>${escapeXml(obligado.nif)}</sum1:NIF>` +
    `</sum1:ObligadoEmision>` +
    (incidencia ? `<sum1:RemisionVoluntaria><sum1:Incidencia>S</sum1:Incidencia></sum1:RemisionVoluntaria>` : "") +
    `</sum:Cabecera>`;
  const body = registros.map((r) => `<sum:RegistroFactura>${r.xml}</sum:RegistroFactura>`).join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sum="${NS_LR}" xmlns:sum1="${NS_INFO}">` +
    `<soapenv:Header/><soapenv:Body><sum:RegFactuSistemaFacturacion>${cabecera}${body}</sum:RegFactuSistemaFacturacion>` +
    `</soapenv:Body></soapenv:Envelope>`
  );
}

// ── Respuesta de la AEAT ─────────────────────────────────────────────────

export interface RespuestaLinea {
  numSerie: string | null;
  operacion: string | null;
  estadoRegistro: string | null;
  codigoError: string | null;
  descripcionError: string | null;
  /** Estado del registro que ya estaba en la AEAT cuando el envío se rechaza por duplicado */
  estadoRegistroDuplicado: string | null;
}

export interface RespuestaEnvio {
  fault: string | null;
  csv: string | null;
  estadoEnvio: string | null;
  tiempoEsperaEnvio: number | null;
  lineas: RespuestaLinea[];
}

const tag = (name: string) => new RegExp(`<(?:[\\w-]+:)?${name}(?:\\s[^>]*)?>([^<]*)</(?:[\\w-]+:)?${name}>`);
const pick = (xml: string, name: string) => xml.match(tag(name))?.[1]?.trim() || null;

export function parseRespuesta(xml: string): RespuestaEnvio {
  const fault = /<(?:[\w-]+:)?Fault[\s>]/.test(xml) ? pick(xml, "faultstring") ?? "SOAP Fault" : null;
  const lineas: RespuestaLinea[] = [];
  const re = /<(?:[\w-]+:)?RespuestaLinea>([\s\S]*?)<\/(?:[\w-]+:)?RespuestaLinea>/g;
  for (let m = re.exec(xml); m; m = re.exec(xml)) {
    const block = m[1]!;
    const dup = block.match(/<(?:[\w-]+:)?RegistroDuplicado>([\s\S]*?)<\/(?:[\w-]+:)?RegistroDuplicado>/)?.[1] ?? "";
    lineas.push({
      numSerie: pick(block, "NumSerieFactura") ?? pick(block, "NumSerieFacturaAnulada"),
      operacion: pick(block, "TipoOperacion"),
      estadoRegistro: pick(block, "EstadoRegistro"),
      codigoError: pick(block.replace(dup, ""), "CodigoErrorRegistro"),
      descripcionError: pick(block.replace(dup, ""), "DescripcionErrorRegistro"),
      estadoRegistroDuplicado: dup ? pick(dup, "EstadoRegistroDuplicado") : null,
    });
  }
  const espera = pick(xml, "TiempoEsperaEnvio");
  return {
    fault,
    csv: pick(xml, "CSV"),
    estadoEnvio: pick(xml, "EstadoEnvio"),
    tiempoEsperaEnvio: espera && /^\d+$/.test(espera) ? Number(espera) : null,
    lineas,
  };
}

/** URL del código QR de cotejo (prewww2 en el entorno de pruebas). */
export function buildQrUrl(env: "test" | "prod", nif: string, numSerie: string, fecha: string, importe: string): string {
  const host = env === "prod" ? "www2.agenciatributaria.gob.es" : "prewww2.aeat.es";
  const q = new URLSearchParams({ nif, numserie: numSerie, fecha, importe });
  return `https://${host}/wlpl/TIKE-CONT/ValidarQR?${q.toString()}`;
}
