import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const PRIMARY = "#4f46e5";

const s = StyleSheet.create({
  page:       { fontFamily: "Helvetica", fontSize: 9, paddingTop: 48, paddingBottom: 60, paddingHorizontal: 50, color: "#111827" },
  header:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  logoBox:    { width: 38, height: 38, backgroundColor: PRIMARY, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  logoLetter: { color: "#fff", fontSize: 20, fontFamily: "Helvetica-Bold" },
  coName:     { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 6 },
  coSub:      { fontSize: 8, color: "#6b7280", marginTop: 1 },
  docType:    { fontSize: 22, fontFamily: "Helvetica-Bold", color: PRIMARY, textAlign: "right" },
  docNum:     { fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 2 },
  badge:      { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: "flex-end" },
  badgeTxt:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#fff" },
  infoRow:    { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f9fafb", borderRadius: 4, padding: 14, marginBottom: 20 },
  infoBlock:  { width: "46%" },
  infoLabel:  { fontSize: 7, color: "#9ca3af", fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 },
  infoName:   { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  infoTxt:    { fontSize: 8, color: "#374151", marginBottom: 2 },
  th:         { flexDirection: "row", backgroundColor: PRIMARY, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 3, marginBottom: 1 },
  thCell:     { fontSize: 7, color: "#fff", fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  tr:         { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", borderBottomStyle: "solid" },
  trAlt:      { backgroundColor: "#f9fafb" },
  td:         { fontSize: 8.5, color: "#374151" },
  cDesc:      { flex: 4 },
  cQty:       { flex: 1.5, textAlign: "center" },
  cRef:       { flex: 2, textAlign: "right" },
  sigBox:     { marginTop: 40, flexDirection: "row", justifyContent: "space-between" },
  sigBlock:   { width: "40%", alignItems: "center" },
  sigLine:    { borderBottomWidth: 1, borderBottomColor: "#374151", borderBottomStyle: "solid", width: "100%", marginBottom: 6 },
  sigLabel:   { fontSize: 8, color: "#6b7280" },
  notes:      { marginBottom: 16, padding: 12, backgroundColor: "#fefce8", borderRadius: 4, borderLeftWidth: 3, borderLeftColor: "#eab308", borderLeftStyle: "solid" },
  notesTxt:   { fontSize: 8.5, color: "#713f12" },
  footer:     { position: "absolute", bottom: 28, left: 50, right: 50, textAlign: "center", fontSize: 7.5, color: "#9ca3af", borderTopWidth: 1, borderTopColor: "#e5e7eb", borderTopStyle: "solid", paddingTop: 8 },
});

const STATUS_COLOR: Record<string, string> = { DRAFT: "#6b7280", SENT: "#2563eb", DELIVERED: "#059669", CANCELLED: "#dc2626" };
const STATUS_LABEL: Record<string, string> = { DRAFT: "BORRADOR", SENT: "ENVIADO", DELIVERED: "ENTREGADO", CANCELLED: "CANCELADO" };

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

export function DeliveryNotePdf({ dn }: { dn: any }) {
  const co    = dn.company ?? {};
  const cl    = dn.client  ?? {};
  const items = dn.items   ?? [];

  return (
    <Document>
      <Page size="A4" style={s.page}>

        <View style={s.header}>
          <View>
            <View style={s.logoBox}>
              <Text style={s.logoLetter}>{(co.name ?? "E")[0].toUpperCase()}</Text>
            </View>
            <Text style={s.coName}>{co.legalName ?? co.name ?? ""}</Text>
            {co.cif     && <Text style={s.coSub}>CIF: {co.cif}</Text>}
            {co.address && <Text style={s.coSub}>{co.address}</Text>}
            {co.email   && <Text style={s.coSub}>{co.email}</Text>}
          </View>
          <View>
            <Text style={s.docType}>ALBARÁN</Text>
            <Text style={s.docNum}>{dn.number}</Text>
            <View style={[s.badge, { backgroundColor: STATUS_COLOR[dn.status] ?? "#6b7280" }]}>
              <Text style={s.badgeTxt}>{STATUS_LABEL[dn.status] ?? dn.status}</Text>
            </View>
          </View>
        </View>

        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Destinatario</Text>
            <Text style={s.infoName}>{cl.name ?? ""}</Text>
            {cl.cifNif  && <Text style={s.infoTxt}>CIF/NIF: {cl.cifNif}</Text>}
            {cl.address && <Text style={s.infoTxt}>{cl.address}</Text>}
            {cl.city    && <Text style={s.infoTxt}>{cl.city}</Text>}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Datos del albarán</Text>
            <Text style={s.infoTxt}>Fecha: {fmtDate(dn.issueDate)}</Text>
            {dn.deliveryDate && <Text style={s.infoTxt}>Entrega: {fmtDate(dn.deliveryDate)}</Text>}
            {dn.deliveryAddress && <Text style={s.infoTxt}>Dirección de entrega: {dn.deliveryAddress}</Text>}
          </View>
        </View>

        <View>
          <View style={s.th}>
            <Text style={[s.thCell, s.cDesc]}>Descripción</Text>
            <Text style={[s.thCell, s.cQty]}>Cantidad</Text>
            <Text style={[s.thCell, s.cRef]}>Referencia</Text>
          </View>
          {items.map((item: any, i: number) => (
            <View key={i} style={[s.tr, i % 2 === 1 ? s.trAlt : {}]}>
              <Text style={[s.td, s.cDesc]}>{item.description}</Text>
              <Text style={[s.td, s.cQty, { textAlign: "center" }]}>
                {Number(item.quantity).toLocaleString("es-ES")}
              </Text>
              <Text style={[s.td, s.cRef, { textAlign: "right" }]}>
                {item.product?.sku ?? "—"}
              </Text>
            </View>
          ))}
        </View>

        {dn.notes && (
          <View style={[s.notes, { marginTop: 20 }]}>
            <Text style={[s.notesTxt, { fontFamily: "Helvetica-Bold", marginBottom: 3 }]}>Notas</Text>
            <Text style={s.notesTxt}>{dn.notes}</Text>
          </View>
        )}

        {/* Signature area */}
        <View style={s.sigBox}>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Firma del receptor</Text>
            <Text style={[s.sigLabel, { marginTop: 3 }]}>Nombre y fecha</Text>
          </View>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Conforme — {co.name ?? ""}</Text>
            <Text style={[s.sigLabel, { marginTop: 3 }]}>Sello y fecha</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>
            {co.legalName ?? co.name ?? ""}
            {co.cif ? ` · CIF: ${co.cif}` : ""}
            {co.address ? ` · ${co.address}` : ""}
            {co.email ? ` · ${co.email}` : ""}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
