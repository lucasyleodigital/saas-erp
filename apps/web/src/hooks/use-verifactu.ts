"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface VerifactuRecord {
  id: string;
  companyId: string;
  invoiceId: string;
  kind: "ALTA" | "ANULACION";
  seq: number;
  hash: string;
  previousHash: string | null;
  status: "GENERATED" | "ACCEPTED" | "REJECTED";
  estadoRegistro: string | null;
  lastError: string | null;
  csv: string | null;
  attempts: number;
  nextAttemptAt: string | null;
  qrCode: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  isLatest?: boolean;
  invoice?: {
    number: string;
    total: string | number;
    issueDate: string;
    client?: { id: string; name: string };
  };
}

export interface VerifactuStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

export interface VerifactuListResponse {
  records: VerifactuRecord[];
  stats: VerifactuStats;
}

export interface VerifactuSettings {
  enabled: boolean;
  activatedAt: string | null;
  firstSentAt: string | null;
  lastSentAt: string | null;
  lockedUntil: string | null;
  canDisable: boolean;
  environment: "test" | "prod";
  pending: number;
  rejected: number;
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

const errorMessage = (err: any, fallback: string) => err?.response?.data?.message ?? fallback;

export function useVerifactuSettings() {
  return useQuery<VerifactuSettings>({
    queryKey: ["verifactu", "settings"],
    queryFn: () => api.get("/verifactu/settings").then((r) => r.data),
    staleTime: 15_000,
  });
}

export function useSetVerifactuEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      api.post("/verifactu/settings", { enabled }).then((r) => r.data as VerifactuSettings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["verifactu"] }),
    onError: (err: any) => toast.error(errorMessage(err, "No se pudo cambiar VERI*FACTU")),
  });
}

export function useResubmitVerifactu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) =>
      api.post(`/verifactu/records/${recordId}/resubmit`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["verifactu"] }),
    onError: (err: any) => toast.error(errorMessage(err, "No se pudo corregir el registro")),
  });
}

export function useRetryVerifactu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/verifactu/retry").then((r) => r.data as { scheduled: number }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["verifactu"] }),
    onError: (err: any) => toast.error(errorMessage(err, "No se pudo reintentar el envío")),
  });
}
