import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useInventorySummary() {
  return useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => api.get("/inventory/summary").then((r) => r.data),
  });
}

export function useStock(params?: {
  warehouseId?: string;
  search?: string;
  trackStockOnly?: boolean;
  lowStockOnly?: boolean;
}) {
  return useQuery({
    queryKey: ["inventory", "stock", params],
    queryFn: () => api.get("/inventory/stock", { params }).then((r) => r.data),
  });
}

export function useStockAlerts() {
  return useQuery({
    queryKey: ["inventory", "alerts"],
    queryFn: () => api.get("/inventory/alerts").then((r) => r.data),
  });
}

export function useValuation(warehouseId?: string) {
  return useQuery({
    queryKey: ["inventory", "valuation", warehouseId],
    queryFn: () =>
      api
        .get("/inventory/valuation", { params: warehouseId ? { warehouseId } : undefined })
        .then((r) => r.data as {
          items: { id: string; name: string; sku?: string; currentStock: number; cost: number; price: number; stockValue: number; margin: number }[];
          totalValue: number;
          totalRevenue: number;
          totalMargin: number;
        }),
  });
}

export function useStockMovements(params?: {
  productId?: string;
  warehouseId?: string;
  type?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["inventory", "movements", params],
    queryFn: () => api.get("/inventory/movements", { params }).then((r) => r.data),
  });
}

export function useAddMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/inventory/movements", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Movimiento de stock registrado");
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Error al registrar movimiento"),
  });
}

export function useTransferStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      fromWarehouseId: string;
      toWarehouseId: string;
      productId: string;
      quantity: number;
      notes?: string;
    }) => api.post("/inventory/transfer", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Transferencia registrada");
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Error en la transferencia"),
  });
}

export function usePhysicalInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { productId: string; warehouseId: string; actualQty: number }[]) =>
      api.post("/inventory/physical", { items }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventario físico aplicado");
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Error al aplicar inventario"),
  });
}

export function useSetMinStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, minStock }: { productId: string; minStock: number | null }) =>
      api.put(`/inventory/stock/${productId}/min-stock`, { minStock }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Stock mínimo actualizado");
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Error al actualizar"),
  });
}

export function useWarehouses() {
  return useQuery({
    queryKey: ["inventory", "warehouses"],
    queryFn: () => api.get("/inventory/warehouses").then((r) => r.data),
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/inventory/warehouses", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "warehouses"] });
      toast.success("Almacén creado");
    },
    onError: () => toast.error("Error al crear el almacén"),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      api.put(`/inventory/warehouses/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "warehouses"] });
      toast.success("Almacén actualizado");
    },
    onError: () => toast.error("Error al actualizar el almacén"),
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/warehouses/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "warehouses"] });
      toast.success("Almacén eliminado");
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Error al eliminar"),
  });
}

export function useSetDefaultWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/inventory/warehouses/${id}/default`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "warehouses"] });
      toast.success("Almacén por defecto actualizado");
    },
  });
}
