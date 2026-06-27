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

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeId: string; projectId?: string }) =>
      api.post("/time-entries/clock-in", data).then((r) => r.data),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success(`Entrada fichada: ${data.employee?.firstName ?? ""}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Error al fichar"),
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeId: string; breakMinutes?: number }) =>
      api.post("/time-entries/clock-out", data).then((r) => r.data),
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
