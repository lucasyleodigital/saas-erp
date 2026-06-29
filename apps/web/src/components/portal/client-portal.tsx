"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, CreditCard, FileText, ClipboardList, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

interface PortalInvoice {
  id: string; number: string; status: string;
  issueDate: string; dueDate: string | null;
  total: number; paidAmount: number; currency: string;
}
interface PortalQuote {
  id: string; number: string; status: string;
  issueDate: string; validUntil: string | null;
  total: number; currency: string;
}
interface PortalData {
  name: string; email: string | null;
  company: { name: string; legalName: string | null; logo: string | null; email: string | null; phone: string | null };
  invoices: PortalInvoice[];
  quotes: PortalQuote[];
}

function fmt(n: number, currency = "EUR") {
  return Number(n).toLocaleString("es-ES", { style: "currency", currency });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES");
}

const INV_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600", SENT: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700", PARTIAL: "bg-blue-100 text-blue-700",
  OVERDUE: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-500",
};
const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600", SENT: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
};

export function ClientPortal({ token }: { token: string }) {
  const t = useTranslations("clientPortal");
  const searchParams = useSearchParams();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"invoices" | "quotes">("invoices");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/portal/${token}`);
      if (!res.ok) throw new Error(t("notFound"));
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Verify payment on return from Stripe
  useEffect(() => {
    const paid = searchParams.get("paid");
    const sessionId = searchParams.get("session_id");
    if (paid && sessionId) {
      fetch(`${API}/portal/${token}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: paid, sessionId }),
      })
        .then(r => r.json())
        .then(result => {
          if (result.paid) setSuccessMsg(t("paymentConfirmed"));
        })
        .catch(() => {})
        .finally(() => fetchData());
    } else {
      fetchData();
    }
  }, [token, searchParams, fetchData]);

  const handlePay = async (invoice: PortalInvoice) => {
    setPayingId(invoice.id);
    try {
      const origin = typeof window !== "undefined" ? window.location.href.split("?")[0] : "";
      const res = await fetch(`${API}/portal/${token}/pay/${invoice.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ successUrl: origin, cancelUrl: origin }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message ?? t("payError"));
      if (result.url) window.location.href = result.url;
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t("payError"));
    } finally {
      setPayingId(null);
    }
  };

  const handleQuoteAction = async (quoteId: string, action: "accept" | "reject") => {
    setActionId(quoteId);
    try {
      const res = await fetch(`${API}/portal/${token}/quotes/${quoteId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const r = await res.json();
        throw new Error(r.message ?? "Error");
      }
      setSuccessMsg(action === "accept" ? t("quoteAccepted") : t("quoteRejected"));
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setActionId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-500 text-sm animate-pulse">{t("loading")}</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">{error}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("contactCompany")}</p>
      </div>
    </div>
  );

  if (!data) return null;

  const pendingInvoices = data.invoices.filter(i => ["SENT", "OVERDUE", "PARTIAL"].includes(i.status));
  const pendingQuotes = data.quotes.filter(q => q.status === "SENT");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
            {(data.company.legalName ?? data.company.name).charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-lg">{data.company.legalName ?? data.company.name}</h1>
            {data.company.email && <p className="text-sm text-gray-500">{data.company.email}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-semibold">{t("hello", { name: data.name })}</h2>
          <p className="text-gray-500 text-sm mt-1">{t("welcomeDesc")}</p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-green-800">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        {/* Pending summary */}
        {(pendingInvoices.length > 0 || pendingQuotes.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {pendingInvoices.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm font-medium text-yellow-800">
                  {pendingInvoices.length > 1 ? t("pendingInvoicesPlural", { count: pendingInvoices.length }) : t("pendingInvoices", { count: pendingInvoices.length })}
                </p>
                <p className="text-lg font-bold text-yellow-900 mt-1">
                  {fmt(pendingInvoices.reduce((s, i) => s + Number(i.total) - Number(i.paidAmount), 0))}
                </p>
              </div>
            )}
            {pendingQuotes.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800">
                  {pendingQuotes.length > 1 ? t("pendingQuotesPlural", { count: pendingQuotes.length }) : t("pendingQuotes", { count: pendingQuotes.length })}
                </p>
                <p className="text-xs text-blue-700 mt-1">{t("pendingQuotesHint")}</p>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setTab("invoices")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "invoices"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="h-4 w-4" />
            {t("invoicesTab", { count: data.invoices.length })}
          </button>
          <button
            onClick={() => setTab("quotes")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "quotes"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            {t("quotesTab", { count: data.quotes.length })}
          </button>
        </div>

        {/* Invoices tab */}
        {tab === "invoices" && (
          <div className="space-y-3">
            {data.invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>{t("noInvoices")}</p>
              </div>
            ) : data.invoices.map(inv => {
              const invColor = INV_STATUS_COLORS[inv.status] ?? INV_STATUS_COLORS.DRAFT;
              const remaining = Math.max(0, Number(inv.total) - Number(inv.paidAmount));
              const canPay = ["SENT", "OVERDUE", "PARTIAL"].includes(inv.status);
              return (
                <div key={inv.id} className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{inv.number}</span>
                      <Badge className={invColor}>{t(`invoiceStatuses.${inv.status.toLowerCase()}`)}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {t("issued", { date: fmtDate(inv.issueDate) })}
                      {inv.dueDate && ` · ${t("dueDate", { date: fmtDate(inv.dueDate) })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{fmt(inv.total, inv.currency)}</p>
                      {inv.status === "PARTIAL" && (
                        <p className="text-sm text-orange-600">{t("pending", { amount: fmt(remaining, inv.currency) })}</p>
                      )}
                    </div>
                    {canPay && (
                      <Button
                        onClick={() => handlePay(inv)}
                        disabled={payingId === inv.id}
                        size="sm"
                        className="shrink-0"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        {payingId === inv.id ? t("redirecting") : t("pay")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quotes tab */}
        {tab === "quotes" && (
          <div className="space-y-3">
            {data.quotes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>{t("noQuotes")}</p>
              </div>
            ) : data.quotes.map(q => {
              const qColor = QUOTE_STATUS_COLORS[q.status] ?? QUOTE_STATUS_COLORS.DRAFT;
              const canAct = q.status === "SENT";
              return (
                <div key={q.id} className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{q.number}</span>
                      <Badge className={qColor}>{t(`quoteStatuses.${q.status.toLowerCase()}`)}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {t("issuedQuote", { date: fmtDate(q.issueDate) })}
                      {q.validUntil && ` · ${t("validUntil", { date: fmtDate(q.validUntil) })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-lg">{fmt(q.total, q.currency)}</p>
                    {canAct && (
                      <div className="flex gap-2">
                        <Button
                          size="sm" variant="default"
                          onClick={() => handleQuoteAction(q.id, "accept")}
                          disabled={actionId === q.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> {t("accept")}
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleQuoteAction(q.id, "reject")}
                          disabled={actionId === q.id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" /> {t("reject")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pt-4 text-xs text-gray-400">
          <Building2 className="h-3 w-3" />
          <span>{t("managedBy", { company: data.company.legalName ?? data.company.name })}</span>
        </div>
      </div>
    </div>
  );
}
