import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PurchaseOrderItem {
  id: string;
  productId?: string | null;
  description: string;
  quantity: number;
  receivedQty: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  product?: { id: string; name: string; sku?: string } | null;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  supplierId: string;
  number: string;
  status: "DRAFT" | "SENT" | "PARTIAL_RECEIVED" | "RECEIVED" | "CANCELLED";
  issueDate: string;
  expectedDate?: string | null;
  notes?: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  items: PurchaseOrderItem[];
  supplier?: { id: string; name: string; email?: string; contactName?: string } | null;
}

export function usePurchaseOrders(params?: {
  search?: string;
  status?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["purchase-orders", params],
    queryFn: () =>
      api
        .get("/purchase-orders", { params })
        .then(
          (r) =>
            r.data as { data: PurchaseOrder[]; total: number; page: number; totalPages: number },
        ),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => api.get(`/purchase-orders/${id}`).then((r) => r.data as PurchaseOrder),
    enabled: !!id,
  });
}

export function usePurchaseOrderStats() {
  return useQuery({
    queryKey: ["purchase-orders", "stats"],
    queryFn: () =>
      api
        .get("/purchase-orders/stats")
        .then(
          (r) =>
            r.data as { total: number; draft: number; sent: number; partial: number; received: number },
        ),
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<PurchaseOrder>) =>
      api.post("/purchase-orders", dto).then((r) => r.data as PurchaseOrder),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: Partial<PurchaseOrder> & { id: string }) =>
      api.put(`/purchase-orders/${id}`, dto).then((r) => r.data as PurchaseOrder),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/purchase-orders/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      items,
    }: {
      id: string;
      items: { itemId: string; receivedQty: number }[];
    }) =>
      api
        .post(`/purchase-orders/${id}/receive`, { items })
        .then((r) => r.data as PurchaseOrder),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
