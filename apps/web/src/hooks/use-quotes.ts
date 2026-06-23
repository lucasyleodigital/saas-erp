import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useQuotes(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["quotes", params],
    queryFn: () => api.get("/quotes", { params }).then((r) => r.data),
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ["quotes", "detail", id],
    queryFn: () => api.get(`/quotes/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/quotes", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Presupuesto creado");
    },
    onError: () => toast.error("Error al crear el presupuesto"),
  });
}

export function useSendQuoteEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/quotes/${id}/send-email`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      if (data.sent) toast.success(`Presupuesto enviado a ${data.to}`);
      else toast.error("No se pudo enviar");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Error al enviar el presupuesto"),
  });
}

export function useUpdateQuoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/quotes/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Estado actualizado");
    },
  });
}

export function useConvertQuoteToInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/quotes/${id}/convert`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Presupuesto convertido a factura ✓");
    },
    onError: () => toast.error("Error al convertir el presupuesto"),
  });
}

export function useDuplicateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/quotes/${id}/duplicate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Presupuesto duplicado como borrador");
    },
    onError: () => toast.error("Error al duplicar el presupuesto"),
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/quotes/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Presupuesto eliminado");
    },
  });
}
