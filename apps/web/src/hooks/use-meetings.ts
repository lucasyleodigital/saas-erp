import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Meeting {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  location?: string;
  participants: string[];
  agenda?: string;
  notes?: string;
  diagnosis?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  sharedWith: string[];
  createdById: string;
  createdAt: string;
}

export function useMeetings(params?: { search?: string; status?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ["meetings", params],
    queryFn: () => api.get("/meetings", { params }).then((r) => r.data as { data: Meeting[]; total: number }),
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ["meetings", id],
    queryFn: () => api.get(`/meetings/${id}`).then((r) => r.data as Meeting),
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Meeting>) => api.post("/meetings", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Reunión creada");
    },
    onError: () => toast.error("Error al crear la reunión"),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Meeting> }) =>
      api.put(`/meetings/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Reunión actualizada");
    },
    onError: () => toast.error("Error al actualizar"),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/meetings/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Reunión eliminada");
    },
    onError: () => toast.error("Error al eliminar"),
  });
}
