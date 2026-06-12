"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface VerifactuRecord {
  id: string;
  companyId: string;
  invoiceId: string;
  hash: string;
  previousHash: string | null;
  status: "GENERATED" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "ERROR";
  qrCode: string | null;
  xml: string;
  sentAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  invoice?: {
    number: string;
    total: string | number;
    issueDate: string;
    client?: { id: string; name: string };
  };
}

export interface VerifactuStats {
  total: number;
  generated: number;
  submitted: number;
  accepted: number;
}

export interface VerifactuListResponse {
  records: VerifactuRecord[];
  stats: VerifactuStats;
}

export function useVerifactuRecords() {
  return useQuery<VerifactuListResponse>({
    queryKey: ["verifactu", "records"],
    queryFn: () => api.get("/verifactu/records").then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useVerifactuStatus(invoiceId: string | undefined) {
  return useQuery<VerifactuRecord | null>({
    queryKey: ["verifactu", "status", invoiceId],
    queryFn: () =>
      invoiceId
        ? api.get(`/verifactu/invoices/${invoiceId}/status`).then((r) => r.data)
        : null,
    enabled: !!invoiceId,
    staleTime: 15_000,
  });
}

export function useGenerateVerifactu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) =>
      api.post(`/verifactu/invoices/${invoiceId}/generate`).then((r) => r.data),
    onSuccess: (_, invoiceId) => {
      toast.success("VeriFactu generado correctamente");
      qc.invalidateQueries({ queryKey: ["verifactu"] });
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Error al generar VeriFactu";
      toast.error(msg);
    },
  });
}
