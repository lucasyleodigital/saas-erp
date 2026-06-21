import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const productKeys = {
  all: ["products"] as const,
  list: (params?: Record<string, unknown>) => [...productKeys.all, "list", params] as const,
};

export function useProducts(params?: { search?: string }) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => api.get("/products", { params }).then((r) => r.data),
    refetchOnMount: true,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/products", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Producto creado");
    },
    onError: () => toast.error("Error al crear el producto"),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`/products/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Producto actualizado");
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Producto eliminado");
    },
    onError: () => toast.error("Error al eliminar el producto"),
  });
}
