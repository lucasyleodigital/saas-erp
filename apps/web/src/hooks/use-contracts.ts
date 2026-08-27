import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface ContractAcceptance {
  id: string;
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  version: string;
  price: number;
  acceptedAt: string;
}

export interface ContractDetail extends ContractAcceptance {
  companyId: string;
  userId: string;
  contentHtml: string;
  ipAddress: string | null;
}

export function useContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: () => api.get<ContractAcceptance[]>("/contracts").then((r) => r.data),
  });
}

export function useContract(id: string | null) {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: () => api.get<ContractDetail>(`/contracts/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export async function downloadContractPdf(id: string, plan: string) {
  try {
    const res = await api.get(`/contracts/${id}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `contrato-youwhole-${plan.toLowerCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.error("Error al descargar el contrato");
  }
}
