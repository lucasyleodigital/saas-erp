"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, CreditCard, FileText, ClipboardList, Building2 } from "lucide-react";

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

const _INV_STATUS = {
  DRAFT:    { label: "Borrador",  color: "bg-gray-100 text-gray-600" },
  SENT:     { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  PAID:     { label: "Pagada",    color: "bg-green-100 text-green-700" },
  PARTIAL:  { label: "Parcial",   color: "bg-blue-100 text-blue-700" },
  OVERDUE:  { label: "Vencida",   color: "bg-red-100 text-red-700" },
  CANCELLED:{ label: "Cancelada", color: "bg-gray-100 text-gray-500" },
};
const INV_STATUS = _INV_STATUS as Record<string, { label: string; color: string }>;
function getInvStatus(s: string) { return INV_STATUS[s] ?? _INV_STATUS.DRAFT; }

const _QUOTE_STATUS = {
  DRAFT:    { label: "Borrador",  color: "bg-gray-100 text-gray-600" },
  SENT:     { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  ACCEPTED: { label: "Aceptado",  color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rechazado", color: "bg-red-100 text-red-700" },
  EXPIRED:  { label: "Expirado",  color: "bg-gray-100 text-gray-500" },
};
const QUOTE_STATUS = _QUOTE_STATUS as Record<string, { label: string; color: string }>;
function getQuoteStatus(s: string) { return QUOTE_STATUS[s] ?? _QUOTE_STATUS.DRAFT; }

export function ClientPortal({ token }: { token: string }) {
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
      if (!res.ok) throw new Error("Portal no encontrado o enlace inválido.");
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar el portal.");
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
          if (result.paid) setSuccessMsg("¡Pago confirmado! La factura ha sido marcada como pagada.");
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
      if (!res.ok) throw new Error(result.message ?? "Error al iniciar el pago");
      if (result.url) window.location.href = result.url;
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al iniciar el pago");
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
      setSuccessMsg(action === "accept" ? "Presupuesto aceptado." : "Presupuesto rechazado.");
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setActionId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-500 text-sm animate-pulse">Cargando portal...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">{error}</h2>
        <p className="text-sm text-gray-500 mt-1">Contacta con la empresa para obtener un enlace válido.</p>
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
          <h2 className="text-xl font-semibold">Hola, {data.name} 👋</h2>
          <p className="text-gray-500 text-sm mt-1">Aquí puedes ver tus facturas y presupuestos.</p>
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
                  {pendingInvoices.length} factura{pendingInvoices.length > 1 ? "s" : ""} pendiente{pendingInvoices.length > 1 ? "s" : ""}
                </p>
                <p className="text-lg font-bold text-yellow-900 mt-1">
                  {fmt(pendingInvoices.reduce((s, i) => s + Number(i.total) - Number(i.paidAmount), 0))}
                </p>
              </div>
            )}
            {pendingQuotes.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800">
                  {pendingQuotes.length} presupuesto{pendingQuotes.length > 1 ? "s" : ""} por responder
                </p>
                <p className="text-xs text-blue-700 mt-1">Pendiente de aceptar o rechazar</p>
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
            Facturas ({data.invoices.length})
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
            Presupuestos ({data.quotes.length})
          </button>
        </div>

        {/* Invoices tab */}
        {tab === "invoices" && (
          <div className="space-y-3">
            {data.invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>No hay facturas disponibles</p>
              </div>
            ) : data.invoices.map(inv => {
              const cfg = getInvStatus(inv.status);
              const remaining = Math.max(0, Number(inv.total) - Number(inv.paidAmount));
              const canPay = ["SENT", "OVERDUE", "PARTIAL"].includes(inv.status);
              return (
                <div key={inv.id} className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{inv.number}</span>
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Emitida: {fmtDate(inv.issueDate)}
                      {inv.dueDate && ` · Vence: ${fmtDate(inv.dueDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{fmt(inv.total, inv.currency)}</p>
                      {inv.status === "PARTIAL" && (
                        <p className="text-sm text-orange-600">Pendiente: {fmt(remaining, inv.currency)}</p>
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
                        {payingId === inv.id ? "Redirigiendo..." : "Pagar"}
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
                <p>No hay presupuestos disponibles</p>
              </div>
            ) : data.quotes.map(q => {
              const cfg = getQuoteStatus(q.status);
              const canAct = q.status === "SENT";
              return (
                <div key={q.id} className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{q.number}</span>
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Emitido: {fmtDate(q.issueDate)}
                      {q.validUntil && ` · Válido hasta: ${fmtDate(q.validUntil)}`}
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
                          <CheckCircle className="h-4 w-4 mr-1" /> Aceptar
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleQuoteAction(q.id, "reject")}
                          disabled={actionId === q.id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Rechazar
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
          <span>Portal gestionado por {data.company.legalName ?? data.company.name}</span>
        </div>
      </div>
    </div>
  );
}
