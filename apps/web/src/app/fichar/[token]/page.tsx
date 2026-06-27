"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn, LogOut, Clock, CalendarDays, MapPin, Loader2, CheckCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, enableHighAccuracy: true },
    );
  });
}

export default function ClockPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(() => {
    fetch(`${API}/employee-portal/${token}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Enlace no valido o empleado inactivo"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleClock(action: "clock-in" | "clock-out") {
    setActing(true);
    setSuccess("");
    try {
      const loc = await getLocation();
      const res = await fetch(`${API}/employee-portal/${token}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loc ?? {}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Error al fichar");
      }
      setSuccess(action === "clock-in" ? "Entrada fichada" : "Salida fichada");
      setTimeout(() => load(), 1000);
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    }
    setActing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4">
      {/* Company header */}
      <div className="text-center mb-6">
        {data.company?.logo && (
          <img src={data.company.logo} alt={data.company.name} className="h-10 mx-auto mb-3 object-contain" />
        )}
        <p className="text-sm text-muted-foreground">{data.company?.name}</p>
      </div>

      {/* Employee card */}
      <Card className="max-w-sm w-full">
        <CardContent className="p-6 space-y-6">
          {/* Employee info */}
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-bold text-xl">
              {data.employee.firstName[0]}{data.employee.lastName[0]}
            </div>
            <h1 className="text-lg font-bold">{data.employee.firstName} {data.employee.lastName}</h1>
            {data.employee.position && (
              <p className="text-sm text-muted-foreground">{data.employee.position}</p>
            )}
          </div>

          {/* Time display */}
          <div className="text-center py-4 rounded-xl bg-muted/50">
            <p className="text-4xl font-bold tabular-nums">{timeStr}</p>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{dateStr}</p>
          </div>

          {/* Status */}
          {data.isClockedIn && data.activeEntry && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-600 font-medium">
                Fichado desde las {new Date(data.activeEntry.clockIn).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-lg py-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg py-2 text-center">
              {error}
            </div>
          )}

          {/* Clock buttons */}
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

          {/* Hours summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{data.todayHours}h</p>
              <p className="text-xs text-muted-foreground">Hoy</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <CalendarDays className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{data.monthHours}h</p>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </div>
          </div>

          {/* Recent entries */}
          {data.recentEntries?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Ultimos fichajes</p>
              <div className="space-y-1">
                {data.recentEntries.slice(0, 5).map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{new Date(e.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}</span>
                    <span>{e.clockIn} - {e.clockOut}</span>
                    <span className="font-medium">{e.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-6">
        Powered by <a href="https://youwhole.com" className="text-primary hover:underline">YouWhole</a>
      </p>
    </div>
  );
}
