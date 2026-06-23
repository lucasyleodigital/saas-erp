"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Users, Building2, FileText, Search, LogIn,
  ChevronRight, ArrowLeft, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

const PLAN_COLORS: Record<string, string> = {
  FREE: "secondary",
  STARTER: "default",
  PRO: "default",
  ENTERPRISE: "default",
};

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [companies, setCompanies] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((r) => { setDashboard(r.data); setLoading(false); })
      .catch((e) => { setError(e?.response?.status === 403 ? "No tienes permisos de Super Admin" : e.message); setLoading(false); });
  }, []);

  useEffect(() => {
    if (error) return;
    api.get("/admin/companies", { params: { page, search: search || undefined } })
      .then((r) => setCompanies(r.data))
      .catch(() => {});
  }, [page, search, error]);

  async function impersonate(companyId: string, companyName: string) {
    if (!confirm(`Vas a entrar como el propietario de "${companyName}". El token durara 2 horas. Continuar?`)) return;
    try {
      const r = await api.post(`/admin/companies/${companyId}/impersonate`);
      localStorage.setItem("admin_original_token", localStorage.getItem("access_token") ?? "");
      localStorage.setItem("access_token", r.data.accessToken);
      toast.success(`Entrando como ${r.data.ownerEmail} en ${r.data.companyName}`);
      window.location.href = "/es/dashboard";
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al impersonar");
    }
  }

  async function changePlan(companyId: string, currentPlan: string) {
    const plans = ["FREE", "STARTER", "PRO", "ENTERPRISE"];
    const plan = prompt(`Plan actual: ${currentPlan}\nNuevo plan (${plans.join(", ")}):`, currentPlan);
    if (!plan || !plans.includes(plan.toUpperCase())) return;
    try {
      await api.patch(`/admin/companies/${companyId}/plan`, { plan: plan.toUpperCase() });
      toast.success("Plan actualizado");
      setCompanies(null);
      api.get("/admin/companies", { params: { page, search: search || undefined } }).then((r) => setCompanies(r.data));
    } catch { toast.error("Error al cambiar plan"); }
  }

  async function toggleActive(companyId: string) {
    try {
      await api.patch(`/admin/companies/${companyId}/toggle-active`);
      toast.success("Estado cambiado");
      if (detail?.id === companyId) loadDetail(companyId);
      api.get("/admin/companies", { params: { page, search: search || undefined } }).then((r) => setCompanies(r.data));
    } catch { toast.error("Error"); }
  }

  async function loadDetail(id: string) {
    try {
      const r = await api.get(`/admin/companies/${id}`);
      setDetail(r.data);
    } catch { toast.error("Error al cargar detalle"); }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Shield className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-destructive">Acceso denegado</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  if (detail) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Button variant="ghost" onClick={() => setDetail(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver a empresas
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{detail.name}</h1>
            <p className="text-sm text-muted-foreground">{detail.legalName} - {detail.cif} - {detail.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={PLAN_COLORS[detail.plan] as any}>{detail.plan}</Badge>
            <Button variant="outline" size="sm" onClick={() => changePlan(detail.id, detail.plan)}>Cambiar plan</Button>
            <Button variant="outline" size="sm" onClick={() => toggleActive(detail.id)}>
              {detail.isActive ? <><ToggleRight className="h-4 w-4 mr-1" /> Activa</> : <><ToggleLeft className="h-4 w-4 mr-1" /> Inactiva</>}
            </Button>
            <Button size="sm" onClick={() => impersonate(detail.id, detail.name)} className="gap-2">
              <LogIn className="h-4 w-4" /> Entrar como
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Clientes", value: detail._count?.clients },
            { label: "Facturas", value: detail._count?.invoices },
            { label: "Productos", value: detail._count?.products },
            { label: "Presupuestos", value: detail._count?.quotes },
            { label: "Leads", value: detail._count?.leads },
          ].map((s) => (
            <Card key={s.label}><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{s.value ?? 0}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {detail.invoiceStats && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Facturacion total</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-muted-foreground">Facturas</p><p className="font-bold">{detail.invoiceStats._count}</p></div>
              <div><p className="text-muted-foreground">Total emitido</p><p className="font-bold">{Number(detail.invoiceStats._sum?.total ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p></div>
              <div><p className="text-muted-foreground">Total cobrado</p><p className="font-bold">{Number(detail.invoiceStats._sum?.paidAmount ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p></div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Usuarios</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detail.users?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{m.user?.firstName} {m.user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{m.role}</Badge>
                    {m.user?.lastLoginAt && <span className="text-xs text-muted-foreground">{new Date(m.user.lastLoginAt).toLocaleDateString("es-ES")}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Panel de administracion
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion de empresas y usuarios de la plataforma</p>
        </div>
        {localStorage.getItem("admin_original_token") && (
          <Button variant="destructive" size="sm" onClick={() => {
            const orig = localStorage.getItem("admin_original_token");
            if (orig) { localStorage.setItem("access_token", orig); localStorage.removeItem("admin_original_token"); }
            window.location.href = "/es/admin";
          }}>
            Volver a mi cuenta admin
          </Button>
        )}
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Empresas", value: dashboard.totalCompanies, icon: Building2 },
            { label: "Usuarios", value: dashboard.totalUsers, icon: Users },
            { label: "Facturas totales", value: dashboard.totalInvoices, icon: FileText },
            { label: "Plan PRO+", value: (dashboard.plans?.PRO ?? 0) + (dashboard.plans?.ENTERPRISE ?? 0), icon: Shield },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">{s.label}</p>
                      <p className="text-2xl font-bold mt-1">{s.value}</p>
                    </div>
                    <Icon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Empresas registradas</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar empresa..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {companies?.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Facturas</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Clientes</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {companies.data.map((c: any) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.cif ?? ""} {!c.isActive && " (inactiva)"}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.email}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={PLAN_COLORS[c.plan] as any} className="cursor-pointer" onClick={() => changePlan(c.id, c.plan)}>
                          {c.plan}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">{c._count?.invoices ?? 0}</td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">{c._count?.clients ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Entrar como" onClick={() => impersonate(c.id, c.name)}>
                            <LogIn className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle" onClick={() => loadDetail(c.id)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No hay empresas registradas</div>
          )}
        </CardContent>
      </Card>

      {companies && companies.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Pagina {page} de {companies.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= companies.totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  );
}
