import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useCalendarEvents(month: number, year: number) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return useQuery({
    queryKey: ["calendar", "events", month, year],
    queryFn: () =>
      api.get("/calendar/events", { params: { from, to } }).then((r) => r.data),
  });
}

export function useCreateCalendarEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/calendar/entries", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Evento creado");
    },
    onError: () => toast.error("Error al crear el evento"),
  });
}

export function useUpdateCalendarEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      api.patch(`/calendar/entries/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar"] }),
    onError: () => toast.error("Error al actualizar"),
  });
}

export function useDeleteCalendarEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/calendar/entries/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Evento eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });
}
