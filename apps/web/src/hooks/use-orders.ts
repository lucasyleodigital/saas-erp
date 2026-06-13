import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface OrderItem {
  id: string;
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
  product?: { id: string; name: string; sku?: string } | null;
}

export interface Order {
  id: string;
  companyId: string;
  clientId: string;
  number: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  issueDate: string;
  deliveryDate?: string | null;
  notes?: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  convertedToDeliveryNoteId?: string | null;
  items: OrderItem[];
  client?: { id: string; name: string; email?: string; phone?: string } | null;
}

export function useOrders(params?: {
  search?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () =>
      api
        .get("/orders", { params })
        .then((r) => r.data as { data: Order[]; total: number; page: number; totalPages: number }),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data as Order),
    enabled: !!id,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ["orders", "stats"],
    queryFn: () =>
      api
        .get("/orders/stats")
        .then((r) => r.data as { total: number; pending: number; confirmed: number; shipped: number }),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<Order>) => api.post("/orders", dto).then((r) => r.data as Order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: Partial<Order> & { id: string }) =>
      api.put(`/orders/${id}`, dto).then((r) => r.data as Order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/orders/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useConvertOrderToDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/orders/${id}/convert`).then((r) => r.data as { id: string; number: string }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["delivery-notes"] });
    },
  });
}
