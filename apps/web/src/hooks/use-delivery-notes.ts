"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface DeliveryNoteItem {
  id: string;
  deliveryNoteId: string;
  productId: string | null;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  discount: string | number;
  subtotal: string | number;
  order: number;
}

export interface DeliveryNote {
  id: string;
  companyId: string;
  clientId: string;
  quoteId: string | null;
  number: string;
  status: "DRAFT" | "SENT" | "DELIVERED" | "INVOICED" | "CANCELLED";
  issueDate: string;
  deliveryDate: string | null;
  notes: string | null;
  subtotal: string | number;
  taxAmount: string | number;
  total: string | number;
  convertedToInvoiceId: string | null;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string };
  quote?: { id: string; number: string } | null;
  items?: DeliveryNoteItem[];
}

export interface DeliveryNoteListResponse {
  data: DeliveryNote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const _DN_STATUS = {
  DRAFT:     { label: "Borrador",   color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  SENT:      { label: "Enviado",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  DELIVERED: { label: "Entregado",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  INVOICED:  { label: "Facturado",  color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  CANCELLED: { label: "Cancelado",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

export const DN_STATUS_CONFIG = _DN_STATUS as Record<string, { label: string; color: string }>;

export function getDNStatusConfig(status: string): { label: string; color: string } {
  return DN_STATUS_CONFIG[status] ?? _DN_STATUS.DRAFT;
}

export function useDeliveryNotes(params?: Record<string, any>) {
  return useQuery<DeliveryNoteListResponse>({
    queryKey: ["delivery-notes", params],
    queryFn: () =>
      api.get("/delivery-notes", { params }).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useDeliveryNote(id: string | undefined) {
  return useQuery<DeliveryNote>({
    queryKey: ["delivery-note", id],
    queryFn: () => api.get(`/delivery-notes/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.post("/delivery-notes", data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Albarán creado");
      qc.invalidateQueries({ queryKey: ["delivery-notes"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al crear el albarán");
    },
  });
}

export function useUpdateDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      api.patch(`/delivery-notes/${id}`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      toast.success("Albarán actualizado");
      qc.invalidateQueries({ queryKey: ["delivery-notes"] });
      qc.invalidateQueries({ queryKey: ["delivery-note", id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al actualizar");
    },
  });
}

export function useUpdateDeliveryNoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/delivery-notes/${id}/status`, { status }).then((r) => r.data),
    onSuccess: (_, { id }) => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["delivery-notes"] });
      qc.invalidateQueries({ queryKey: ["delivery-note", id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al cambiar estado");
    },
  });
}

export function useConvertDeliveryNoteToInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/delivery-notes/${id}/convert-to-invoice`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Albarán convertido a factura");
      qc.invalidateQueries({ queryKey: ["delivery-notes"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al convertir");
    },
  });
}

export function useDeleteDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/delivery-notes/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Albarán eliminado");
      qc.invalidateQueries({ queryKey: ["delivery-notes"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al eliminar");
    },
  });
}

export function useCreateDeliveryNoteFromQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) =>
      api.post(`/delivery-notes/from-quote/${quoteId}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Albarán creado desde presupuesto");
      qc.invalidateQueries({ queryKey: ["delivery-notes"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al crear albarán");
    },
  });
}
