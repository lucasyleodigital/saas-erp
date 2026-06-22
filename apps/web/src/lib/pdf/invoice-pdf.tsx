import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const DEFAULT_COLOR = "#4f46e5";

function createStyles(primary: string) {
  return StyleSheet.create({
    page:        { fontFamily: "Helvetica", fontSize: 9, paddingTop: 48, paddingBottom: 80, paddingHorizontal: 50, color: "#111827" },
    header:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
    logoImg:     { width: 48, height: 48, borderRadius: 4, objectFit: "contain", marginBottom: 6 },
    logoBox:     { width: 38, height: 38, backgroundColor: primary, borderRadius: 6, alignItems: "center", justifyContent: "center" },
    logoLetter:  { color: "#fff", fontSize: 20, fontFamily: "Helvetica-Bold" },
    coName:      { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 6 },
    coSub:       { fontSize: 8, color: "#6b7280", marginTop: 1 },
    docType:     { fontSize: 22, fontFamily: "Helvetica-Bold", color: primary, textAlign: "right" },
    docNum:      { fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 2 },
    badge:       { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: "flex-end" },
    badgeTxt:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#fff" },
    infoRow:     { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f9fafb", borderRadius: 4, padding: 14, marginBottom: 20 },
    infoBlock:   { width: "46%" },
    infoLabel:   { fontSize: 7, color: "#9ca3af", fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 },
    infoName:    { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 3 },
    infoTxt:     { fontSize: 8, color: "#374151", marginBottom: 2 },
    th:          { flexDirection: "row", backgroundColor: primary, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 3, marginBottom: 1 },
    thCell:      { fontSize: 7, color: "#fff", fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
    tr:          { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", borderBottomStyle: "solid" },
    trAlt:       { backgroundColor: "#f9fafb" },
    td:          { fontSize: 8.5, color: "#374151" },
    cDesc:       { flex: 3 },
    cQty:        { flex: 1, textAlign: "center" },
    cPrice:      { flex: 1.5, textAlign: "right" },
    cDisc:       { flex: 1, textAlign: "center" },
    cIva:        { flex: 1, textAlign: "center" },
    cTotal:      { flex: 1.5, textAlign: "right" },
    totals:      { alignItems: "flex-end", marginTop: 8, marginBottom: 20 },
    tRow:        { flexDirection: "row", width: 210, justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 10 },
    tLbl:        { fontSize: 9, color: "#6b7280" },
    tVal:        { fontSize: 9, color: "#111827", fontFamily: "Helvetica-Bold" },
    tRowFinal:   { flexDirection: "row", width: 210, justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 10, backgroundColor: primary, borderRadius: 4, marginTop: 4 },
    tLblFinal:   { fontSize: 11, color: "#fff", fontFamily: "Helvetica-Bold" },
    tValFinal:   { fontSize: 11, color: "#fff", fontFamily: "Helvetica-Bold" },
    notes:       { marginBottom: 16, padding: 12, backgroundColor: "#fefce8", borderRadius: 4, borderLeftWidth: 3, borderLeftColor: "#eab308", borderLeftStyle: "solid" },
    notesTxt:    { fontSize: 8.5, color: "#713f12" },
    bankBox:     { marginBottom: 16, padding: 12, backgroundColor: "#f0f9ff", borderRadius: 4, borderLeftWidth: 3, borderLeftColor: primary, borderLeftStyle: "solid" },
    bankLabel:   { fontSize: 7, color: "#9ca3af", fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    bankTxt:     { fontSize: 8.5, color: "#1e3a5f", marginBottom: 1 },
    termsBox:    { marginBottom: 16, padding: 12 },
    termsTxt:    { fontSize: 8, color: "#6b7280" },
    footer:      { position: "absolute", bottom: 28, left: 50, right: 50, textAlign: "center", fontSize: 7.5, color: "#9ca3af", borderTopWidth: 1, borderTopColor: "#e5e7eb", borderTopStyle: "solid", paddingTop: 8 },
  });
}

const STATUS_COLOR: Record<string, string> = { DRAFT: "#6b7280", SENT: "#2563eb", PARTIAL: "#d97706", PAID: "#059669", OVERDUE: "#dc2626", CANCELLED: "#6b7280" };
const STATUS_LABEL: Record<string, string> = { DRAFT: "BORRADOR", SENT: "ENVIADA", PARTIAL: "PAGO PARCIAL", PAID: "PAGADA", OVERDUE: "VENCIDA", CANCELLED: "CANCELADA" };

const fmt = (n: number, cur = "EUR") =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: cur }).format(n);
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

export function InvoicePdf({ invoice }: { invoice: any }) {
  const co       = invoice.company ?? {};
  const cl       = invoice.client  ?? {};
  const items    = invoice.items   ?? [];
  const taxes    = invoice.taxes   ?? [];
  const cur      = invoice.currency ?? "EUR";
  const settings = co.settings ?? {};
  const bank     = co.bankAccounts?.[0];
  const primary  = settings.invoiceColor || DEFAULT_COLOR;
  const s        = createStyles(primary);

  const companyAddress = [co.address, co.postalCode, co.city, co.province]
    .filter(Boolean).join(", ");

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            {co.logo ? (
              <Image src={co.logo} style={s.logoImg} />
            ) : (
              <View style={s.logoBox}>
                <Text style={s.logoLetter}>{(co.name ?? "E")[0].toUpperCase()}</Text>
              </View>
            )}
            <Text style={s.coName}>{co.legalName ?? co.name ?? ""}</Text>
            {co.cif       && <Text style={s.coSub}>CIF: {co.cif}</Text>}
            {companyAddress && <Text style={s.coSub}>{companyAddress}</Text>}
            {co.email     && <Text style={s.coSub}>{co.email}</Text>}
            {co.phone     && <Text style={s.coSub}>{co.phone}</Text>}
            {co.website   && <Text style={s.coSub}>{co.website}</Text>}
          </View>
          <View>
            <Text style={s.docType}>FACTURA</Text>
            <Text style={s.docNum}>{invoice.number}</Text>
            <View style={[s.badge, { backgroundColor: STATUS_COLOR[invoice.status] ?? "#6b7280" }]}>
              <Text style={s.badgeTxt}>{STATUS_LABEL[invoice.status] ?? invoice.status}</Text>
            </View>
          </View>
        </View>

        {/* Client + dates */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Facturar a</Text>
            <Text style={s.infoName}>{cl.name ?? ""}</Text>
            {cl.cifNif  && <Text style={s.infoTxt}>CIF/NIF: {cl.cifNif}</Text>}
            {cl.address && <Text style={s.infoTxt}>{cl.address}</Text>}
            {cl.city    && <Text style={s.infoTxt}>{cl.city}</Text>}
            {cl.email   && <Text style={s.infoTxt}>{cl.email}</Text>}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Detalles</Text>
            <Text style={s.infoTxt}>Fecha emision: {fmtDate(invoice.issueDate)}</Text>
            {invoice.dueDate && <Text style={s.infoTxt}>Vencimiento: {fmtDate(invoice.dueDate)}</Text>}
            <Text style={s.infoTxt}>Moneda: {cur}</Text>
            {invoice.series?.prefix && <Text style={s.infoTxt}>Serie: {invoice.series.prefix}</Text>}
          </View>
        </View>

        {/* Items */}
        <View>
          <View style={s.th}>
            <Text style={[s.thCell, s.cDesc]}>Concepto</Text>
            <Text style={[s.thCell, s.cQty]}>Cant.</Text>
            <Text style={[s.thCell, s.cPrice]}>Precio u.</Text>
            <Text style={[s.thCell, s.cDisc]}>Dto%</Text>
            <Text style={[s.thCell, s.cIva]}>IVA%</Text>
            <Text style={[s.thCell, s.cTotal]}>Total</Text>
          </View>
          {items.map((item: any, i: number) => (
            <View key={i} style={[s.tr, i % 2 === 1 ? s.trAlt : {}]}>
              <Text style={[s.td, s.cDesc]}>{item.description}</Text>
              <Text style={[s.td, s.cQty]}>{Number(item.quantity).toLocaleString("es-ES")}</Text>
              <Text style={[s.td, s.cPrice]}>{fmt(Number(item.unitPrice), cur)}</Text>
              <Text style={[s.td, s.cDisc]}>{Number(item.discount) > 0 ? `${item.discount}%` : "—"}</Text>
              <Text style={[s.td, s.cIva]}>{Number(item.taxRate) > 0 ? `${item.taxRate}%` : "—"}</Text>
              <Text style={[s.td, s.cTotal, { fontFamily: "Helvetica-Bold" }]}>
                {fmt(Number(item.subtotal), cur)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.tRow}>
            <Text style={s.tLbl}>Base imponible</Text>
            <Text style={s.tVal}>{fmt(Number(invoice.subtotal), cur)}</Text>
          </View>
          {taxes.length > 0
            ? taxes.map((t: any, i: number) => (
                <View key={i} style={s.tRow}>
                  <Text style={s.tLbl}>{t.tax?.name ?? `IVA ${t.rate}%`}</Text>
                  <Text style={s.tVal}>{fmt(Number(t.amount), cur)}</Text>
                </View>
              ))
            : Number(invoice.taxAmount) > 0 && (
                <View style={s.tRow}>
                  <Text style={s.tLbl}>IVA</Text>
                  <Text style={s.tVal}>{fmt(Number(invoice.taxAmount), cur)}</Text>
                </View>
              )}
          <View style={s.tRowFinal}>
            <Text style={s.tLblFinal}>TOTAL</Text>
            <Text style={s.tValFinal}>{fmt(Number(invoice.total), cur)}</Text>
          </View>
          {Number(invoice.paidAmount) > 0 && (
            <View style={[s.tRow, { marginTop: 4 }]}>
              <Text style={[s.tLbl, { color: "#059669" }]}>Pagado</Text>
              <Text style={[s.tVal, { color: "#059669" }]}>{fmt(Number(invoice.paidAmount), cur)}</Text>
            </View>
          )}
        </View>

        {/* Bank account */}
        {bank && (
          <View style={s.bankBox}>
            <Text style={s.bankLabel}>Datos de pago</Text>
            <Text style={s.bankTxt}>Titular: {co.legalName ?? co.name}</Text>
            {bank.iban && <Text style={[s.bankTxt, { fontFamily: "Helvetica-Bold" }]}>IBAN: {bank.iban}</Text>}
            {bank.bic  && <Text style={s.bankTxt}>BIC/SWIFT: {bank.bic}</Text>}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={s.notes}>
            <Text style={[s.notesTxt, { fontFamily: "Helvetica-Bold", marginBottom: 3 }]}>Notas</Text>
            <Text style={s.notesTxt}>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment terms */}
        {settings.invoiceTerms && (
          <View style={s.termsBox}>
            <Text style={s.termsTxt}>{settings.invoiceTerms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>
            {settings.invoiceFooter
              ? settings.invoiceFooter
              : [
                  co.legalName ?? co.name,
                  co.cif ? `CIF: ${co.cif}` : "",
                  companyAddress,
                  co.email,
                ].filter(Boolean).join(" · ")}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
