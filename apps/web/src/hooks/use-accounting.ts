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
