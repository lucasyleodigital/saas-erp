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
import { formatCurrency, cn } from "@/lib/utils";
import { useGpsConsent, GpsConsentBanner } from "@/components/time-tracking/gps-consent";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboard.employee");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [breakDialog, setBreakDialog] = useState(false);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [showPayslips, setShowPayslips] = useState(false);
  const { consented: gpsConsented, accept: acceptGps, reject: rejectGps } = useGpsConsent();

  function load() {
    api.get("/my/dashboard").then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleClock(action: "clock-in" | "clock-out", breakMinutes?: number) {
    setActing(true);
    try {
      const loc = await getLocation(gpsConsented === true);
      const body = { ...(loc ?? {}), ...(action === "clock-out" && breakMinutes !== undefined ? { breakMinutes } : {}) };
      await api.post(`/my/${action}`, body);
      const gpsMsg = loc ? t("withLocation") : "";
      toast.success((action === "clock-in" ? t("clockedInSuccess") : t("clockedOutSuccess")) + gpsMsg);
      setTimeout(load, 1000);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("clockError"));
    }
    setActing(false);
  }

  function loadPayslips() {
    api.get("/my/payslips").then((r) => { setPayslips(r.data); setShowPayslips(true); }).catch(() => toast.error(t("payslips.loadError")));
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
        {t("loadError")}
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
        <h1 className="text-xl font-bold">{t("hello", { name: data.employee.firstName })}</h1>
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
              {t("location")}: {gpsConsented ? t("locationOn") : t("locationOff")}
            </span>
          </div>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => gpsConsented ? rejectGps() : acceptGps()}
          >
            {gpsConsented ? t("disable") : t("enable")}
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
                  {t("clockedSince", { time: new Date(data.activeEntry.clockIn).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) })}
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
              {t("clockIn")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 text-base gap-2"
              onClick={() => setBreakDialog(true)}
              disabled={acting || !data.isClockedIn}
            >
              {acting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
              {t("clockOut")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("today"), value: `${data.summary?.today ?? 0}h`, icon: Clock, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: t("week"), value: `${data.summary?.week ?? 0}h`, icon: CalendarDays, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: t("month"), value: `${data.summary?.month ?? 0}h`, icon: Briefcase, color: "text-purple-600", bg: "bg-purple-500/10" },
          { label: t("overtime"), value: `${data.summary?.overtime ?? 0}h`, icon: Zap, color: "text-amber-600", bg: "bg-amber-500/10" },
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
            <CardTitle className="text-sm">{t("recentEntries")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.recentEntries.map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm gap-2">
                  <span className="text-muted-foreground shrink-0">
                    {new Date(e.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="text-muted-foreground">{e.clockIn} - {e.clockOut ?? "—"}</span>
                  {e.breakMinutes > 0 && (
                    <span className="text-xs text-amber-600 shrink-0">{e.breakMinutes}m {t("break")}</span>
                  )}
                  <span className="font-semibold shrink-0">{e.hours}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-12 gap-2" onClick={() => setLeaveDialog(true)}>
          <CalendarOff className="h-4 w-4" /> {t("requestDays")}
        </Button>
        <Button variant="outline" className="h-12 gap-2" onClick={loadPayslips}>
          <Receipt className="h-4 w-4" /> {t("viewPayslips")}
        </Button>
      </div>

      {/* Upcoming leaves */}
      {data.upcomingLeaves?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarOff className="h-4 w-4" /> {t("upcomingAbsences")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingLeaves.map((l: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5">
                <Badge variant="secondary" className="text-xs">{l.type}</Badge>
                <span>{l.startDate} - {l.endDate}</span>
                <span className="font-medium">{t("daysCount", { days: l.days })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {data.pendingLeaves > 0 && (
        <p className="text-sm text-amber-600 text-center">{t("pendingRequests", { count: data.pendingLeaves })}</p>
      )}

      {/* Break + clock-out dialog */}
      <BreakDialog
        open={breakDialog}
        onOpenChange={setBreakDialog}
        onConfirm={(mins) => { setBreakDialog(false); handleClock("clock-out", mins); }}
        acting={acting}
      />

      {/* Leave request dialog */}
      <LeaveRequestDialog open={leaveDialog} onOpenChange={setLeaveDialog} onSuccess={load} />

      {/* Payslips dialog */}
      <PayslipsDialog open={showPayslips} onOpenChange={setShowPayslips} payslips={payslips} />
    </div>
  );
}

// ─── Break Dialog ─────────────────────────────────────────────────────────────

const BREAK_OPTIONS = [0, 15, 20, 30, 45, 60];

function BreakDialog({
  open, onOpenChange, onConfirm, acting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (breakMinutes: number) => void;
  acting: boolean;
}) {
  const t = useTranslations("dashboard.employee");
  const [selected, setSelected] = useState(0);
  const [custom, setCustom] = useState("");
  const isCustom = selected === -1;
  const minutes = isCustom ? (Number(custom) || 0) : selected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            {t("breakDialog.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("breakDialog.subtitle")}</p>
          <div className="grid grid-cols-3 gap-2">
            {BREAK_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelected(opt)}
                className={cn(
                  "rounded-lg border py-2.5 text-sm font-medium transition-all",
                  selected === opt && !isCustom
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40"
                )}
              >
                {opt === 0 ? t("breakDialog.noBreak") : `${opt} min`}
              </button>
            ))}
            <button
              onClick={() => setSelected(-1)}
              className={cn(
                "rounded-lg border py-2.5 text-sm font-medium transition-all col-span-3",
                isCustom ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
              )}
            >
              {t("breakDialog.custom")}
            </button>
          </div>
          {isCustom && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="480"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="0"
                className="h-9"
                autoFocus
              />
              <span className="text-sm text-muted-foreground shrink-0">min</span>
            </div>
          )}
          {minutes > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {t("breakDialog.preview", { minutes })}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("breakDialog.cancel")}</Button>
          <Button onClick={() => onConfirm(minutes)} disabled={acting}>
            {acting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t("breakDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaveRequestDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
  const t = useTranslations("dashboard.employee.leaveDialog");
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
      toast.success(t("success"));
      onOpenChange(false);
      onSuccess();
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t("error"));
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("type")}</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="VACATION">{t("vacation")}</option>
              <option value="SICK">{t("sick")}</option>
              <option value="PERSONAL">{t("personal")}</option>
              <option value="MATERNITY">{t("maternity")}</option>
              <option value="OTHER">{t("other")}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("from")}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t("to")}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("reason")}</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reasonPlaceholder")} />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PayslipsDialog({ open, onOpenChange, payslips }: { open: boolean; onOpenChange: (o: boolean) => void; payslips: any[] }) {
  const t = useTranslations("dashboard.employee.payslips");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        {payslips.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("empty")}</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {payslips.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                <div>
                  <p className="font-medium">{t(`months.${p.month}`)} {p.year}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("gross")}: {formatCurrency(Number(p.baseSalary))} | {t("irpf")}: {formatCurrency(Number(p.irpfAmount ?? 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{formatCurrency(Number(p.netSalary))}</p>
                  <Badge variant="secondary" className="text-xs">{t(`status.${p.status}`)}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
