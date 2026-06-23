import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank", "accounts"],
    queryFn: () => api.get("/bank/accounts").then((r) => r.data),
    refetchOnMount: true,
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/bank/accounts", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank"] });
      toast.success("Cuenta bancaria creada");
    },
    onError: () => toast.error("Error al crear la cuenta"),
  });
}

export function useImportBankStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, file }: { accountId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return api
        .post(`/bank/accounts/${accountId}/import`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["bank"] });
      toast.success(`${data.imported ?? 0} movimientos importados`);
    },
    onError: () => toast.error("Error al importar el extracto"),
  });
}
