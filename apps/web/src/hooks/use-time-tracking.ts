import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useTimeEntries(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["time-entries", params],
    queryFn: () => api.get("/time-entries", { params }).then((r) => r.data),
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/time-entries", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Entrada registrada");
    },
    onError: () => toast.error("Error al registrar"),
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/time-entries/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success("Entrada eliminada");
    },
    onError: () => toast.error("Error al eliminar"),
  });
}

const GPS_KEY = "youwhole_gps_consent";

function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const consent = localStorage.getItem(GPS_KEY);
  if (consent !== "true") {
    console.log("[GPS] Consentimiento no aceptado");
    return Promise.resolve(null);
  }
  if (!navigator.geolocation) {
    console.log("[GPS] Navegador no soporta geolocalizacion");
    return Promise.resolve(null);
  }

  console.log("[GPS] Solicitando ubicacion...");
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("[GPS] OK:", pos.coords.latitude, pos.coords.longitude);
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => {
        console.warn("[GPS] Error:", err.code, err.message);
        toast.error(`GPS: ${err.code === 1 ? "Permiso denegado por el navegador" : err.code === 2 ? "Ubicacion no disponible" : "Tiempo agotado"}`);
        resolve(null);
      },
      { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 },
    );
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { employeeId: string; projectId?: string; method?: string }) => {
      const loc = await getLocation();
      return api.post("/time-entries/clock-in", { ...data, ...loc, method: data.method ?? "WEB" }).then((r) => r.data);
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      const hasGps = localStorage.getItem(GPS_KEY) === "true";
      toast.success(`Entrada fichada: ${data.employee?.firstName ?? ""}${hasGps ? " (con GPS)" : ""}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Error al fichar"),
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { employeeId: string; breakMinutes?: number }) => {
      const loc = await getLocation();
      return api.post("/time-entries/clock-out", { ...data, ...loc }).then((r) => r.data);
    },
    onSuccess: (data: any) => {
      const hours = ((data.totalMinutes ?? 0) / 60).toFixed(1);
      toast.success(`Salida fichada: ${hours}h trabajadas`);
      qc.invalidateQueries({ queryKey: ["time-entries"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Error al fichar salida"),
  });
}

export function useActiveClocks() {
  return useQuery({
    queryKey: ["time-entries", "active"],
    queryFn: () => api.get("/time-entries/active").then((r) => r.data),
    refetchInterval: 60000,
  });
}

export function useTimeSummary(employeeId?: string) {
  return useQuery({
    queryKey: ["time-entries", "summary", employeeId],
    queryFn: () => api.get("/time-entries/summary", { params: employeeId ? { employeeId } : {} }).then((r) => r.data),
  });
}

export function useMonthlyReport(year: number, month: number) {
  return useQuery({
    queryKey: ["time-entries", "report", year, month],
    queryFn: () => api.get("/time-entries/report", { params: { year, month } }).then((r) => r.data),
  });
}

export function useWeeklyView(weekStart?: string) {
  return useQuery({
    queryKey: ["time-entries", "weekly", weekStart],
    queryFn: () => api.get("/time-entries/weekly", { params: weekStart ? { weekStart } : {} }).then((r) => r.data),
  });
}

export function useMissedClocks() {
  return useQuery({
    queryKey: ["time-entries", "missed"],
    queryFn: () => api.get("/time-entries/missed").then((r) => r.data),
    refetchInterval: 300000,
  });
}
