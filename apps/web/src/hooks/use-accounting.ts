import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useProfitAndLoss(year: number) {
  return useQuery({
    queryKey: ["accounting", "profit-loss", year],
    queryFn: () => api.get("/accounting/profit-loss", { params: { year } }).then((r) => r.data),
  });
}

export function useVatReport(year: number) {
  return useQuery({
    queryKey: ["accounting", "vat-report", year],
    queryFn: () => api.get("/accounting/vat-report", { params: { year } }).then((r) => r.data),
  });
}

export function useJournalEntries(params?: { type?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: ["accounting", "journal-entries", params],
    queryFn: () => api.get("/accounting/journal-entries", { params }).then((r) => r.data),
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/accounting/journal-entries", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting"] });
      toast.success("Asiento contable creado");
    },
    onError: () => toast.error("Error al crear el asiento"),
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/accounting/journal-entries/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting"] });
      toast.success("Asiento eliminado");
    },
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounting", "accounts"],
    queryFn: () => api.get("/accounting/accounts").then((r) => r.data),
    staleTime: 10 * 60 * 1000, // accounts change rarely
  });
}

export function useLibroFacturas(year: number) {
  return useQuery({
    queryKey: ["accounting", "libro-facturas", year],
    queryFn: () => api.get("/accounting/libro-facturas", { params: { year } }).then((r) => r.data),
  });
}

export function useModelo130(year: number) {
  return useQuery({
    queryKey: ["accounting", "modelo-130", year],
    queryFn: () => api.get("/accounting/modelo-130", { params: { year } }).then((r) => r.data),
  });
}

export function useModelo347(year: number) {
  return useQuery({
    queryKey: ["accounting", "modelo-347", year],
    queryFn: () => api.get("/accounting/modelo-347", { params: { year } }).then((r) => r.data),
  });
}

export function useRetenciones(year: number) {
  return useQuery({
    queryKey: ["accounting", "retenciones", year],
    queryFn: () => api.get("/accounting/retenciones", { params: { year } }).then((r) => r.data),
  });
}

export function useBackfillTaxes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/accounting/backfill-taxes").then((r) => r.data),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["accounting"] });
      toast.success(`${data.fixed} facturas corregidas`);
    },
    onError: () => toast.error("Error al corregir impuestos"),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/accounting/accounts/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting", "accounts"] });
      toast.success("Cuenta actualizada");
    },
    onError: () => toast.error("Error al actualizar"),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/accounting/accounts/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting", "accounts"] });
      toast.success("Cuenta eliminada");
    },
    onError: () => toast.error("No se puede eliminar (tiene asientos asociados)"),
  });
}
