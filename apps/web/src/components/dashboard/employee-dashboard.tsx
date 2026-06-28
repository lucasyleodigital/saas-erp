"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  LogIn, LogOut, Clock, CalendarDays, Zap, Loader2,
  MapPin, Briefcase, CalendarOff, Receipt, CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useGpsConsent, GpsConsentBanner } from "@/components/time-tracking/gps-consent";

function getLocation(allowed: boolean): Promise<{ latitude: number; longitude: number } | null> {
  if (!allowed) return Promise.resolve(null);
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, enableHighAccuracy: true },
    );
  });
}

export function EmployeeDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [showPayslips, setShowPayslips] = useState(false);
  const { consented: gpsConsented, accept: acceptGps, reject: rejectGps } = useGpsConsent();

  function load() {
    api.get("/my/dashboard").then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleClock(action: "clock-in" | "clock-out") {
    setActing(true);
    try {
      const loc = await getLocation(gpsConsented === true);
      await api.post(`/my/${action}`, loc ?? {});
      const gpsMsg = loc ? " (con ubicacion)" : "";
      toast.success((action === "clock-in" ? "Entrada fichada" : "Salida fichada") + gpsMsg);
      setTimeout(load, 1000);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al fichar");
    }
    setActing(false);
  }

  function loadPayslips() {
    api.get("/my/payslips").then((r) => { setPayslips(r.data); setShowPayslips(true); }).catch(() => toast.error("Error al cargar nominas"));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No se pudo cargar tu portal. Contacta con tu empresa.
      </div>
    );
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-bold text-xl">
          {data.employee.firstName[0]}{data.employee.lastName?.[0] ?? ""}
        </div>
        <h1 className="text-xl font-bold">Hola, {data.employee.firstName}!</h1>
        {data.employee.position && (
          <p className="text-sm text-muted-foreground">{data.employee.position}</p>
        )}
      </div>

      {/* GPS consent */}
      {gpsConsented === null && (
        <GpsConsentBanner onAccept={acceptGps} onReject={rejectGps} />
      )}

      {/* GPS status */}
      {gpsConsented !== null && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/20 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${gpsConsented ? "text-green-600" : "text-muted-foreground"}`} />
            <span className="text-muted-foreground">
              Ubicacion: {gpsConsented ? "Activada" : "Desactivada"}
            </span>
          </div>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => gpsConsented ? rejectGps() : acceptGps()}
          >
            {gpsConsented ? "Desactivar" : "Activar"}
          </button>
        </div>
      )}

      {/* Clock section */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <p className="text-4xl font-bold tabular-nums">{timeStr}</p>
            {data.isClockedIn && data.activeEntry && (
              <div className="flex items-center justify-center gap-2 text-sm mt-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-600 font-medium">
                  Fichado desde las {new Date(data.activeEntry.clockIn).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="h-14 text-base gap-2"
              onClick={() => handleClock("clock-in")}
              disabled={acting || data.isClockedIn}
            >
              {acting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              Entrada
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 text-base gap-2"
              onClick={() => handleClock("clock-out")}
              disabled={acting || !data.isClockedIn}
            >
              {acting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
              Salida
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Hoy", value: `${data.summary?.today ?? 0}h`, icon: Clock, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Semana", value: `${data.summary?.week ?? 0}h`, icon: CalendarDays, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Mes", value: `${data.summary?.month ?? 0}h`, icon: Briefcase, color: "text-purple-600", bg: "bg-purple-500/10" },
          { label: "Extras", value: `${data.summary?.overtime ?? 0}h`, icon: Zap, color: "text-amber-600", bg: "bg-amber-500/10" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-3 text-center">
              <kpi.icon className={`h-5 w-5 mx-auto mb-1 ${kpi.color}`} />
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent entries */}
      {data.recentEntries?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fichajes recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.recentEntries.map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span>{e.clockIn} - {e.clockOut}</span>
                  <span className="font-semibold">{e.hours}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-12 gap-2" onClick={() => setLeaveDialog(true)}>
          <CalendarOff className="h-4 w-4" /> Solicitar dias
        </Button>
        <Button variant="outline" className="h-12 gap-2" onClick={loadPayslips}>
          <Receipt className="h-4 w-4" /> Ver nominas
        </Button>
      </div>

      {/* Upcoming leaves */}
      {data.upcomingLeaves?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarOff className="h-4 w-4" /> Proximas ausencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingLeaves.map((l: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5">
                <Badge variant="secondary" className="text-xs">{l.type}</Badge>
                <span>{l.startDate} - {l.endDate}</span>
                <span className="font-medium">{l.days} dias</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {data.pendingLeaves > 0 && (
        <p className="text-sm text-amber-600 text-center">{data.pendingLeaves} solicitud(es) pendiente(s) de aprobacion</p>
      )}

      {/* Leave request dialog */}
      <LeaveRequestDialog open={leaveDialog} onOpenChange={setLeaveDialog} onSuccess={load} />

      {/* Payslips dialog */}
      <PayslipsDialog open={showPayslips} onOpenChange={setShowPayslips} payslips={payslips} />
    </div>
  );
}

function LeaveRequestDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
  const [type, setType] = useState("VACATION");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setSubmitting(true);
    try {
      await api.post("/my/leaves", { type, startDate, endDate, reason: reason || undefined });
      toast.success("Solicitud enviada. Tu empresa la revisara.");
      onOpenChange(false);
      onSuccess();
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al enviar solicitud");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Solicitar dias</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="VACATION">Vacaciones</option>
              <option value="SICK">Baja medica</option>
              <option value="PERSONAL">Asuntos propios</option>
              <option value="MATERNITY">Maternidad/Paternidad</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Desde</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Hasta</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Motivo (opcional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Viaje familiar..." />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PayslipsDialog({ open, onOpenChange, payslips }: { open: boolean; onOpenChange: (o: boolean) => void; payslips: any[] }) {
  const MONTHS = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const STATUS_LABELS: Record<string, string> = { DRAFT: "Borrador", APPROVED: "Aprobada", PAID: "Pagada" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mis nominas</DialogTitle>
        </DialogHeader>
        {payslips.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No tienes nominas todavia</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {payslips.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                <div>
                  <p className="font-medium">{MONTHS[p.month]} {p.year}</p>
                  <p className="text-xs text-muted-foreground">
                    Bruto: {formatCurrency(Number(p.baseSalary))} | IRPF: {formatCurrency(Number(p.irpfAmount ?? 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{formatCurrency(Number(p.netSalary))}</p>
                  <Badge variant="secondary" className="text-xs">{STATUS_LABELS[p.status] ?? p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
