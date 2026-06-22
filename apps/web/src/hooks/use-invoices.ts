import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (params?: Record<string, unknown>) => [...invoiceKeys.all, "list", params] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
};

export function useInvoices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => api.get("/invoices", { params }).then((r) => r.data),
    refetchOnMount: true,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => api.get(`/invoices/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/invoices", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Factura creada correctamente");
    },
    onError: () => toast.error("Error al crear la factura"),
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/invoices/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Estado actualizado");
    },
  });
}

export function useSendInvoiceEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/invoices/${id}/send-email`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      if (data.sent) toast.success(`Factura enviada a ${data.to}`);
      else toast.error("No se pudo enviar");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Error al enviar la factura"),
  });
}

export function useDuplicateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/invoices/${id}/duplicate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Factura duplicada como borrador");
    },
    onError: () => toast.error("Error al duplicar la factura"),
  });
}

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      api.post("/invoices/bulk/status", { ids, status }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success(`${data.updated} facturas actualizadas`);
    },
    onError: () => toast.error("Error al actualizar facturas"),
  });
}

export function useSetRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isRecurring, interval }: { id: string; isRecurring: boolean; interval?: string }) =>
      api.patch(`/invoices/${id}/recurring`, { isRecurring, interval }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Recurrencia actualizada");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Error al configurar recurrencia"),
  });
}

export function useCreatePaymentLink() {
  return useMutation({
    mutationFn: (invoiceId: string) => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      return api.post(`/invoices/${invoiceId}/payment-link`, {
        successUrl: `${origin}/es/facturas?paid=${invoiceId}`,
        cancelUrl: `${origin}/es/facturas`,
      }).then((r) => r.data as { url: string; amount: number });
    },
    onSuccess: async (data) => {
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        toast.success("Link de pago copiado al portapapeles");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al crear link de pago");
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Factura eliminada");
    },
    onError: () => toast.error("Error al eliminar la factura"),
  });
}

export function useRegisterPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      amount,
      method,
    }: {
      invoiceId: string;
      amount: number;
      method: string;
    }) =>
      api
        .post(`/invoices/${invoiceId}/payments`, { amount, method })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Pago registrado");
    },
    onError: () => toast.error("Error al registrar el pago"),
  });
}
