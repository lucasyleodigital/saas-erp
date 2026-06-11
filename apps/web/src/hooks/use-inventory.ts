import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useInventorySummary() {
  return useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => api.get("/inventory/summary").then((r) => r.data),
  });
}

export function useStock(params?: { warehouseId?: string; search?: string; trackStockOnly?: boolean }) {
  return useQuery({
    queryKey: ["inventory", "stock", params],
    queryFn: () => api.get("/inventory/stock", { params }).then((r) => r.data),
  });
}

export function useStockMovements(params?: { productId?: string; warehouseId?: string; page?: number }) {
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
  });
}
