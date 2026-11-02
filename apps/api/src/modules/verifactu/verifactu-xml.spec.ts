// Ejemplos oficiales del documento de huella de la AEAT (v0.1.2, apartado 6).
// Ejecutar con: pnpm --filter @saas/api test
import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  buildEnvelope, buildQrUrl, buildRegistroAlta, buildRegistroAnulacion, formatFecha, formatFechaHoraHuso,
  huellaAlta, huellaAltaString, huellaAnulacion, parseRespuesta,
} from "./verifactu-xml";

test("huella del primer registro de alta (caso 1 de la AEAT)", () => {
  const input = {
    idEmisor: "89890001K", numSerie: "12345678/G33", fechaExpedicion: "01-01-2024", tipoFactura: "F1",
    cuotaTotal: "12.35", importeTotal: "123.45", huellaAnterior: null, fechaHoraHuso: "2024-01-01T19:20:30+01:00",
  };
  assert.equal(
    huellaAltaString(input),
    "IDEmisorFactura=89890001K&NumSerieFactura=12345678/G33&FechaExpedicionFactura=01-01-2024&TipoFactura=F1&CuotaTotal=12.35&ImporteTotal=123.45&Huella=&FechaHoraHusoGenRegistro=2024-01-01T19:20:30+01:00",
  );
  assert.equal(huellaAlta(input), "3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60");
});

test("huella de un alta encadenada (caso 2 de la AEAT)", () => {
  assert.equal(
    huellaAlta({
      idEmisor: "89890001K", numSerie: "12345679/G34", fechaExpedicion: "01-01-2024", tipoFactura: "F1",
      cuotaTotal: "12.35", importeTotal: "123.45",
      huellaAnterior: "3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60",
      fechaHoraHuso: "2024-01-01T19:20:35+01:00",
    }),
    "F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97",
  );
});

test("huella de una anulación (caso 3 de la AEAT)", () => {
  assert.equal(
    huellaAnulacion({
      idEmisor: "89890001K", numSerie: "12345679/G34", fechaExpedicion: "01-01-2024",
      huellaAnterior: "F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97",
      fechaHoraHuso: "2024-01-01T19:20:40+01:00",
    }),
    "177547C0D57AC74748561D054A9CEC14B4C4EA23D1BEFD6F2E69E3A388F90C68",
  );
});

test("la huella ignora los espacios al principio y al final de cada valor", () => {
  const base = {
    idEmisor: "89890001K", numSerie: "12345678/G33", fechaExpedicion: "01-01-2024", tipoFactura: "F1",
    cuotaTotal: "12.35", importeTotal: "123.45", huellaAnterior: null, fechaHoraHuso: "2024-01-01T19:20:30+01:00",
  };
  assert.equal(huellaAlta({ ...base, numSerie: " 12345678/G33 " }), huellaAlta(base));
});

test("fechas en hora peninsular, con el huso de invierno y de verano", () => {
  assert.equal(formatFecha(new Date("2026-11-01T23:30:00Z")), "02-11-2026");
  assert.equal(formatFechaHoraHuso(new Date("2026-11-02T09:05:07Z")), "2026-11-02T10:05:07+01:00");
  assert.equal(formatFechaHoraHuso(new Date("2026-07-15T12:00:00Z")), "2026-07-15T14:00:00+02:00");
});

const alta = (over: Partial<Parameters<typeof buildRegistroAlta>[0]> = {}) =>
  buildRegistroAlta({
    idEmisor: "B12345678", nombreEmisor: "Empresa & Hijos S.L.", numSerie: "FAC-0001", fechaExpedicion: "02-11-2026",
    tipoFactura: "F1", descripcion: "Diseño web", destinatario: { nombre: "Cliente S.A.", nif: "A87654321" },
    desglose: [{ tipoImpositivo: 21, base: 100, cuota: 21 }], cuotaTotal: "21.00", importeTotal: "121.00",
    anterior: null, numeroInstalacion: "empresa-1", fechaHoraHuso: "2026-11-02T10:05:07+01:00", huella: "A".repeat(64),
    ...over,
  });

test("el alta usa el espacio de nombres de SuministroInformacion y escapa el texto", () => {
  const xml = alta();
  assert.match(xml, /^<sum1:RegistroAlta xmlns:sum1="https:\/\/www2\.agenciatributaria\.gob\.es\/.*SuministroInformacion\.xsd">/);
  assert.match(xml, /<sum1:NombreRazonEmisor>Empresa &amp; Hijos S\.L\.<\/sum1:NombreRazonEmisor>/);
  assert.match(xml, /<sum1:PrimerRegistro>S<\/sum1:PrimerRegistro>/);
  assert.match(xml, /<sum1:BaseImponibleOimporteNoSujeto>100\.00<\/sum1:BaseImponibleOimporteNoSujeto>/);
  assert.match(xml, /<sum1:NIF>41003566V<\/sum1:NIF>/);
  assert.doesNotMatch(xml, /Subsanacion|RechazoPrevio/);
});

test("el alta por rechazo lleva Subsanacion=S y RechazoPrevio=X antes de TipoFactura", () => {
  const xml = alta({
    subsanacion: true, rechazoPrevio: "X",
    anterior: { idEmisor: "B12345678", numSerie: "FAC-0000", fechaExpedicion: "01-11-2026", huella: "B".repeat(64) },
  });
  assert.match(xml, /<sum1:Subsanacion>S<\/sum1:Subsanacion><sum1:RechazoPrevio>X<\/sum1:RechazoPrevio><sum1:TipoFactura>/);
  assert.match(xml, /<sum1:RegistroAnterior><sum1:IDEmisorFactura>B12345678<\/sum1:IDEmisorFactura><sum1:NumSerieFactura>FAC-0000/);
});

test("anulación y sobre SOAP", () => {
  const anul = buildRegistroAnulacion({
    idEmisor: "B12345678", numSerie: "FAC-0001", fechaExpedicion: "02-11-2026", sinRegistroPrevio: true,
    anterior: null, numeroInstalacion: "empresa-1", fechaHoraHuso: "2026-11-02T10:05:07+01:00", huella: "C".repeat(64),
  });
  assert.match(anul, /<sum1:SinRegistroPrevio>S<\/sum1:SinRegistroPrevio>/);
  const env = buildEnvelope({ nombre: "Empresa", nif: "B12345678" }, [{ kind: "ALTA", xml: alta() }, { kind: "ANULACION", xml: anul }], true);
  assert.equal((env.match(/<sum:RegistroFactura>/g) ?? []).length, 2);
  assert.match(env, /<sum1:Incidencia>S<\/sum1:Incidencia>/);
  assert.throws(() => buildEnvelope({ nombre: "E", nif: "B12345678" }, []));
});

test("lectura de la respuesta de la AEAT, con un duplicado", () => {
  const xml = `<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Body><tikR:RespuestaRegFactuSistemaFacturacion xmlns:tikR="r" xmlns:tik="t">
    <tikR:CSV>A-ABC123</tikR:CSV><tikR:TiempoEsperaEnvio>60</tikR:TiempoEsperaEnvio><tikR:EstadoEnvio>ParcialmenteCorrecto</tikR:EstadoEnvio>
    <tikR:RespuestaLinea><tikR:IDFactura><tik:IDEmisorFactura>B12345678</tik:IDEmisorFactura><tik:NumSerieFactura>FAC-0001</tik:NumSerieFactura></tikR:IDFactura>
      <tikR:Operacion><tik:TipoOperacion>Alta</tik:TipoOperacion></tikR:Operacion><tikR:EstadoRegistro>Correcto</tikR:EstadoRegistro></tikR:RespuestaLinea>
    <tikR:RespuestaLinea><tikR:IDFactura><tik:NumSerieFactura>FAC-0002</tik:NumSerieFactura></tikR:IDFactura>
      <tikR:EstadoRegistro>Incorrecto</tikR:EstadoRegistro><tikR:CodigoErrorRegistro>3000</tikR:CodigoErrorRegistro><tikR:DescripcionErrorRegistro>Registro duplicado</tikR:DescripcionErrorRegistro>
      <tikR:RegistroDuplicado><tik:IdPeticionRegistroDuplicado>1</tik:IdPeticionRegistroDuplicado><tik:EstadoRegistroDuplicado>Correcta</tik:EstadoRegistroDuplicado></tikR:RegistroDuplicado></tikR:RespuestaLinea>
  </tikR:RespuestaRegFactuSistemaFacturacion></env:Body></env:Envelope>`;
  const r = parseRespuesta(xml);
  assert.equal(r.fault, null);
  assert.equal(r.csv, "A-ABC123");
  assert.equal(r.tiempoEsperaEnvio, 60);
  assert.equal(r.lineas.length, 2);
  assert.deepEqual(r.lineas[0], { numSerie: "FAC-0001", operacion: "Alta", estadoRegistro: "Correcto", codigoError: null, descripcionError: null, estadoRegistroDuplicado: null });
  assert.equal(r.lineas[1]!.codigoError, "3000");
  assert.equal(r.lineas[1]!.estadoRegistroDuplicado, "Correcta");
  assert.equal(parseRespuesta(`<s:Envelope><s:Body><s:Fault><faultstring>Error de esquema</faultstring></s:Fault></s:Body></s:Envelope>`).fault, "Error de esquema");
});

test("QR de cotejo con los parámetros codificados", () => {
  assert.equal(
    buildQrUrl("prod", "B12345678", "FAC/0001", "02-11-2026", "121.00"),
    "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=B12345678&numserie=FAC%2F0001&fecha=02-11-2026&importe=121.00",
  );
});
