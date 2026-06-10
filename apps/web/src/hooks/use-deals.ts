import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function usePipeline() {
  return useQuery({
    queryKey: ["deals", "pipeline"],
    queryFn: () => api.get("/deals/pipeline").then((r) => r.data),
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/deals", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal creado");
    },
    onError: () => toast.error("Error al crear el deal"),
  });
}

export function useMoveDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      api.put(`/deals/${id}/stage`, { stageId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
    onError: () => toast.error("Error al mover el deal"),
  });
}
