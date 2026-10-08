import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useShipments(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["shipments", params],
    queryFn: () =>
      api.get("/shipments", { params }).then((r) => r.data),
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/shipments", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      toast.success("DeCA generado correctamente");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Error al generar el DeCA";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });
}

export function useAnularShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/shipments/${id}/anular`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      toast.success("DeCA anulado");
    },
    onError: () => toast.error("Error al anular el DeCA"),
  });
}
