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
  status: "GENERATED" | "SIGNED" | "SENT" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "ERROR";
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
  sent: number;
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

export interface CertificateInfo {
  subject: string;
  nif: string;
  expiresAt: string | null;
  uploadedAt: string | null;
  isExpired: boolean;
  daysLeft: number | null;
}

export function useCertificateInfo() {
  return useQuery<CertificateInfo | null>({
    queryKey: ["verifactu", "certificate"],
    queryFn: () => api.get("/verifactu/certificate").then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useSaveCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { file: File; password: string }) => {
      const form = new FormData();
      form.append("cert", payload.file);
      form.append("password", payload.password);
      return api.post("/verifactu/certificate", form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data as CertificateInfo);
    },
    onSuccess: () => {
      toast.success("Certificado guardado correctamente");
      qc.invalidateQueries({ queryKey: ["verifactu", "certificate"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al guardar el certificado");
    },
  });
}

export function useDeleteCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/verifactu/certificate").then((r) => r.data),
    onSuccess: () => {
      toast.success("Certificado eliminado");
      qc.invalidateQueries({ queryKey: ["verifactu", "certificate"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al eliminar el certificado");
    },
  });
}

export function useSendToAeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) =>
      api.post(`/verifactu/records/${recordId}/send`).then((r) => r.data),
    onSuccess: (data) => {
      if (data.status === "ACCEPTED") {
        toast.success(`Aceptado por AEAT. CSV: ${data.csv ?? "—"}`);
      } else {
        toast.warning(`AEAT respondió: ${data.estado}${data.error ? ` — ${data.error}` : ""}`);
      }
      qc.invalidateQueries({ queryKey: ["verifactu"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al enviar a AEAT");
    },
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
