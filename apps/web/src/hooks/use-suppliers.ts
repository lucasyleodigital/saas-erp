import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  cifNif?: string | null;
  contactName?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
  website?: string | null;
  notes?: string | null;
  bankAccount?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { purchaseOrders: number };
}

export function useSuppliers(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () =>
      api
        .get("/suppliers", { params })
        .then((r) => r.data as { data: Supplier[]; total: number; page: number; totalPages: number }),
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => api.get(`/suppliers/${id}`).then((r) => r.data as Supplier),
    enabled: !!id,
  });
}

export function useSupplierStats() {
  return useQuery({
    queryKey: ["suppliers", "stats"],
    queryFn: () =>
      api.get("/suppliers/stats").then((r) => r.data as { total: number; active: number; inactive: number }),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<Supplier>) => api.post("/suppliers", dto).then((r) => r.data as Supplier),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: Partial<Supplier> & { id: string }) =>
      api.put(`/suppliers/${id}`, dto).then((r) => r.data as Supplier),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
