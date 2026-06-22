"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface DiagResult {
  status: string;
  apiUrl: string;
  authToken: boolean;
  healthCheck: { ok: boolean; data?: any; error?: string };
  debugCounts: { ok: boolean; data?: any; error?: string };
  clientsApi: { ok: boolean; data?: any; error?: string };
  invoicesApi: { ok: boolean; data?: any; error?: string };
  productsApi: { ok: boolean; data?: any; error?: string };
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );
}

export default function DiagnosticoPage() {
  const [result, setResult] = useState<DiagResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runDiag() {
    setLoading(true);
    const apiUrl = (api.defaults as any).baseURL ?? "unknown";
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const diag: DiagResult = {
      status: "running",
      apiUrl,
      authToken: !!token,
      healthCheck: { ok: false },
      debugCounts: { ok: false },
      clientsApi: { ok: false },
      invoicesApi: { ok: false },
      productsApi: { ok: false },
    };

    // Health check (no auth needed)
    try {
      const baseUrl = apiUrl.replace(/\/api\/v1$/, "");
      const r = await fetch(`${baseUrl}/health`);
      const d = await r.json();
      diag.healthCheck = { ok: r.ok, data: d };
    } catch (e: any) {
      diag.healthCheck = { ok: false, error: e.message };
    }

    // Debug counts (no auth needed)
    try {
      const r = await api.get("/debug/counts");
      diag.debugCounts = { ok: true, data: r.data };
    } catch (e: any) {
      diag.debugCounts = { ok: false, error: e.response?.status ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}` : e.message };
    }

    // Clients API
    try {
      const r = await api.get("/clients", { params: { page: 1, limit: 5 } });
      diag.clientsApi = { ok: true, data: { total: r.data?.total, count: r.data?.data?.length, sample: r.data?.data?.[0]?.name } };
    } catch (e: any) {
      diag.clientsApi = { ok: false, error: e.response?.status ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}` : e.message };
    }

    // Invoices API
    try {
      const r = await api.get("/invoices", { params: { page: 1, limit: 5 } });
      diag.invoicesApi = { ok: true, data: { total: r.data?.total, count: r.data?.data?.length, sample: r.data?.data?.[0]?.number } };
    } catch (e: any) {
      diag.invoicesApi = { ok: false, error: e.response?.status ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}` : e.message };
    }

    // Products API
    try {
      const r = await api.get("/products", { params: { page: 1, limit: 5 } });
      diag.productsApi = { ok: true, data: { total: r.data?.total, count: r.data?.data?.length, sample: r.data?.data?.[0]?.name, samplePrice: r.data?.data?.[0]?.price } };
    } catch (e: any) {
      diag.productsApi = { ok: false, error: e.response?.status ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}` : e.message };
    }

    diag.status = "done";
    setResult(diag);
    setLoading(false);
  }

  useEffect(() => { runDiag(); }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Diagnostico del sistema
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verifica la conexion con la API y el estado de los datos
          </p>
        </div>
        <Button onClick={runDiag} disabled={loading} size="sm" variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Repetir
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Connection info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Conexion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">API URL</span>
                <span className="font-mono text-xs">{result.apiUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token JWT</span>
                <span>{result.authToken ? "Presente" : "No encontrado"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Health check */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <StatusIcon ok={result.healthCheck.ok} />
                Health Check (API server)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {result.healthCheck.ok ? (
                <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto">{JSON.stringify(result.healthCheck.data, null, 2)}</pre>
              ) : (
                <p className="text-red-500 font-mono text-xs">{result.healthCheck.error}</p>
              )}
            </CardContent>
          </Card>

          {/* Debug counts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <StatusIcon ok={result.debugCounts.ok} />
                Conteo de registros en BD
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {result.debugCounts.ok ? (
                <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto">{JSON.stringify(result.debugCounts.data, null, 2)}</pre>
              ) : (
                <p className="text-red-500 font-mono text-xs">{result.debugCounts.error}</p>
              )}
            </CardContent>
          </Card>

          {/* API endpoints */}
          {[
            { label: "GET /clients", data: result.clientsApi },
            { label: "GET /invoices", data: result.invoicesApi },
            { label: "GET /products", data: result.productsApi },
          ].map(({ label, data }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <StatusIcon ok={data.ok} />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {data.ok ? (
                  <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto">{JSON.stringify(data.data, null, 2)}</pre>
                ) : (
                  <p className="text-red-500 font-mono text-xs">{data.error}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
