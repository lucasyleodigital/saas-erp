import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useFiscalCalendar(year: number) {
  return useQuery({
    queryKey: ["fiscal", "calendar", year],
    queryFn: () => api.get("/fiscal/calendar", { params: { year } }).then((r) => r.data),
  });
}

export function useAnnualSummary(year: number) {
  return useQuery({
    queryKey: ["fiscal", "annual", year],
    queryFn: () => api.get("/fiscal/annual-summary", { params: { year } }).then((r) => r.data),
  });
}

export function useM303(year: number, quarter: number) {
  return useQuery({
    queryKey: ["fiscal", "m303", year, quarter],
    queryFn: () => api.get("/fiscal/m303", { params: { year, quarter } }).then((r) => r.data),
  });
}

export function useM130(year: number, quarter: number) {
  return useQuery({
    queryKey: ["fiscal", "m130", year, quarter],
    queryFn: () => api.get("/fiscal/m130", { params: { year, quarter } }).then((r) => r.data),
  });
}

export function useFiscalPeriods(year: number) {
  return useQuery({
    queryKey: ["fiscal", "periods", year],
    queryFn: () => api.get("/fiscal/periods", { params: { year } }).then((r) => r.data),
  });
}

export function useMarkFiled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, quarter, body }: { year: number; quarter: number; body: any }) =>
      api.post(`/fiscal/periods/${year}/${quarter}/file`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal"] });
      toast.success("Modelo marcado como presentado");
    },
    onError: () => toast.error("Error al guardar"),
  });
}

export function useExpenses(params: { year?: number; quarter?: number }) {
  return useQuery({
    queryKey: ["fiscal", "expenses", params],
    queryFn: () => api.get("/fiscal/expenses", { params }).then((r) => r.data),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/fiscal/expenses", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal"] });
      toast.success("Gasto registrado");
    },
    onError: () => toast.error("Error al registrar el gasto"),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/fiscal/expenses/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal"] });
      toast.success("Gasto eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });
}
