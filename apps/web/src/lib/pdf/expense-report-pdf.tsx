import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const PRIMARY = "#0d9488";

// Plantillas con {marcadores}; las rellena fill(). Llegan ya traducidas desde usePdfLabels.
export interface ExpenseReportPdfLabels {
  locale: string;
  title: string;
  status: Record<string, string>;
  categories: Record<string, string>;
  perDiem: Record<string, string>;
  methods: Record<string, string>;
  employee: string;
  report: string;
  submitted: string;
  approved: string;
  approvedBy: string;
  reimbursement: string;
  date: string;
  category: string;
  detail: string;
  vat: string;
  amount: string;
  project: string;
  companyCardPaid: string;
  rejected: string;
  total: string;
  lessCard: string;
  toReimburse: string;
  taxableNote: string;
  employeeSignature: string;
  approvedBySignature: string;
  footer: string;
  days: string;
}

const s = StyleSheet.create({
  page:      { fontFamily: "Helvetica", fontSize: 9, paddingTop: 44, paddingBottom: 60, paddingHorizontal: 44, color: "#111827" },
  header:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  coName:    { fontSize: 12, fontFamily: "Helvetica-Bold" },
  coSub:     { fontSize: 8, color: "#6b7280", marginTop: 2 },
  docType:   { fontSize: 18, fontFamily: "Helvetica-Bold", color: PRIMARY, textAlign: "right" },
  docNum:    { fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 2 },
  docStatus: { fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 4, color: "#374151" },
  info:      { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f8fafc", borderRadius: 4, padding: 12, marginBottom: 16 },
  infoBlock: { width: "48%" },
  label:     { fontSize: 7, color: "#9ca3af", fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  infoName:  { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  infoTxt:   { fontSize: 8, color: "#374151", marginBottom: 1.5 },
  th:        { flexDirection: "row", backgroundColor: PRIMARY, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 3 },
  thCell:    { fontSize: 7, color: "#fff", fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  tr:        { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", borderBottomStyle: "solid" },
  td:        { fontSize: 8, color: "#374151" },
  tdMuted:   { fontSize: 7, color: "#6b7280", marginTop: 1 },
  cDate:     { width: 52 },
  cCat:      { width: 78 },
  cDesc:     { flex: 1, paddingRight: 6 },
  cVat:      { width: 50, textAlign: "right" },
  cAmt:      { width: 62, textAlign: "right" },
  rejected:  { color: "#b91c1c" },
  totals:    { marginTop: 12, marginLeft: "auto", width: 220 },
  totalRow:  { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalBold: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderTopWidth: 1, borderTopColor: "#111827", borderTopStyle: "solid", marginTop: 3 },
  note:      { marginTop: 14, fontSize: 7.5, color: "#6b7280", lineHeight: 1.4 },
  sigBox:    { marginTop: 36, flexDirection: "row", justifyContent: "space-between" },
  sigBlock:  { width: "42%", alignItems: "center" },
  sigLine:   { borderBottomWidth: 1, borderBottomColor: "#374151", borderBottomStyle: "solid", width: "100%", marginBottom: 5, height: 28 },
  sigLabel:  { fontSize: 8, color: "#6b7280" },
  footer:    { position: "absolute", bottom: 26, left: 44, right: 44, textAlign: "center", fontSize: 7, color: "#9ca3af", borderTopWidth: 1, borderTopColor: "#e5e7eb", borderTopStyle: "solid", paddingTop: 7 },
});

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));

export function ExpenseReportPdf({ report, company, labels: l }: { report: any; company: any; labels: ExpenseReportPdfLabels }) {
  const claims: any[] = report.claims ?? [];
  const active = claims.filter((c) => c.status !== "REJECTED");
  const total = active.reduce((sum, c) => sum + Number(c.amount), 0);
  const card = active.filter((c) => c.paidWithCompanyCard).reduce((sum, c) => sum + Number(c.amount), 0);
  const taxable = active.reduce((sum, c) => sum + Number(c.taxableAmount), 0);
  const emp = report.employee ?? {};
  const eur = (n: number) => new Intl.NumberFormat(l.locale, { style: "currency", currency: "EUR" }).format(n);
  const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString(l.locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  const decimal = (n: number, digits: number) =>
    new Intl.NumberFormat(l.locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

  function detail(c: any) {
    if (c.category === "MILEAGE") {
      const route = [c.origin, c.destination].filter(Boolean).join(" - ");
      return `${route ? route + " · " : ""}${Number(c.distanceKm)} km × ${decimal(Number(c.mileageRate), 3)} €/km`;
    }
    if (c.category === "PER_DIEM") return `${l.perDiem[c.perDiemType] ?? ""} · ${Number(c.perDiemDays)} ${l.days}`;
    return [c.merchant, c.merchantNif].filter(Boolean).join(" · ") || c.description || "";
  }

  return (
    <Document title={`${report.number} ${report.title}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.coName}>{company?.legalName ?? company?.name ?? ""}</Text>
            {company?.cif && <Text style={s.coSub}>CIF: {company.cif}</Text>}
            {company?.address && <Text style={s.coSub}>{company.address}{company.city ? `, ${company.city}` : ""}</Text>}
          </View>
          <View>
            <Text style={s.docType}>{l.title}</Text>
            <Text style={s.docNum}>{report.number}</Text>
            <Text style={s.docStatus}>{l.status[report.status] ?? report.status}</Text>
          </View>
        </View>

        <View style={s.info}>
          <View style={s.infoBlock}>
            <Text style={s.label}>{l.employee}</Text>
            <Text style={s.infoName}>{emp.firstName} {emp.lastName}</Text>
            {emp.nif && <Text style={s.infoTxt}>NIF: {emp.nif}</Text>}
            {(emp.position || emp.department) && (
              <Text style={s.infoTxt}>{[emp.position, emp.department].filter(Boolean).join(" · ")}</Text>
            )}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.label}>{l.report}</Text>
            <Text style={s.infoName}>{report.title}</Text>
            <Text style={s.infoTxt}>{fill(l.submitted, { date: fmtDate(report.submittedAt) })}</Text>
            {report.approvedAt && (
              <Text style={s.infoTxt}>
                {fill(l.approved, { date: fmtDate(report.approvedAt) })}
                {report.approverName ? fill(l.approvedBy, { name: report.approverName }) : ""}
              </Text>
            )}
            {report.reimbursementMethod && (
              <Text style={s.infoTxt}>{fill(l.reimbursement, { method: l.methods[report.reimbursementMethod] ?? "" })}</Text>
            )}
          </View>
        </View>

        <View style={s.th}>
          <Text style={[s.thCell, s.cDate]}>{l.date}</Text>
          <Text style={[s.thCell, s.cCat]}>{l.category}</Text>
          <Text style={[s.thCell, s.cDesc]}>{l.detail}</Text>
          <Text style={[s.thCell, s.cVat]}>{l.vat}</Text>
          <Text style={[s.thCell, s.cAmt]}>{l.amount}</Text>
        </View>
        {claims.map((c) => {
          const rejected = c.status === "REJECTED";
          return (
            <View key={c.id} style={s.tr} wrap={false}>
              <Text style={[s.td, s.cDate]}>{fmtDate(c.date)}</Text>
              <Text style={[s.td, s.cCat]}>{l.categories[c.category] ?? c.category}</Text>
              <View style={s.cDesc}>
                <Text style={s.td}>{detail(c)}</Text>
                {c.description && c.merchant && <Text style={s.tdMuted}>{c.description}</Text>}
                {c.project && <Text style={s.tdMuted}>{fill(l.project, { name: c.project.name })}</Text>}
                {c.paidWithCompanyCard && <Text style={s.tdMuted}>{l.companyCardPaid}{c.card ? ` ·${c.card.last4}` : ""}</Text>}
                {rejected && <Text style={[s.tdMuted, s.rejected]}>{l.rejected}{c.rejectionReason ? `: ${c.rejectionReason}` : ""}</Text>}
              </View>
              <Text style={[s.td, s.cVat]}>{c.vatDeductible ? `${Number(c.vatRate)}%` : "—"}</Text>
              <Text style={[s.td, s.cAmt, rejected ? s.rejected : {}]}>{rejected ? `(${eur(Number(c.amount))})` : eur(Number(c.amount))}</Text>
            </View>
          );
        })}

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.td}>{l.total}</Text>
            <Text style={s.td}>{eur(total)}</Text>
          </View>
          {card > 0 && (
            <View style={s.totalRow}>
              <Text style={s.td}>{l.lessCard}</Text>
              <Text style={s.td}>-{eur(card)}</Text>
            </View>
          )}
          <View style={s.totalBold}>
            <Text style={[s.td, { fontFamily: "Helvetica-Bold" }]}>{l.toReimburse}</Text>
            <Text style={[s.td, { fontFamily: "Helvetica-Bold" }]}>{eur(total - card)}</Text>
          </View>
        </View>

        {taxable > 0 && <Text style={s.note}>{fill(l.taxableNote, { amount: eur(taxable) })}</Text>}

        <View style={s.sigBox}>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>{l.employeeSignature}</Text>
          </View>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>{l.approvedBySignature}{report.approverName ? `: ${report.approverName}` : ""}</Text>
          </View>
        </View>

        <Text style={s.footer} fixed>
          {company?.name ?? ""} · {fill(l.footer, { number: report.number })}
        </Text>
      </Page>
    </Document>
  );
}
