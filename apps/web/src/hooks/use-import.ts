"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type ImportEntity = "clients" | "products" | "invoices";

export interface ImportError { row: number; field: string; message: string; }
export interface ImportResult { total: number; inserted: number; skipped: number; errors: ImportError[]; }
export interface FieldDef { key: string; label: string; required: boolean; }
export interface PreviewResult {
  columns: string[];
  sample: Record<string, string>[];
  suggestions: Record<string, string>;
  fields: FieldDef[];
}

export function usePreviewImport(entity: ImportEntity) {
  return useMutation<PreviewResult, any, File>({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api
        .post(`/import/preview/${entity}`, form, { headers: { "Content-Type": "multipart/form-data" } })
        .then((r) => r.data);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "No se pudo leer el archivo");
    },
  });
}

export function useImportFile(entity: ImportEntity) {
  const qc = useQueryClient();
  return useMutation<ImportResult, any, { file: File; mapping: Record<string, string> }>({
    mutationFn: ({ file, mapping }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("mapping", JSON.stringify(mapping));
      return api
        .post(`/import/${entity}`, form, { headers: { "Content-Type": "multipart/form-data" } })
        .then((r) => r.data);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: [entity] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (result.errors.length === 0) {
        toast.success(`${result.inserted} registros importados correctamente`);
      } else {
        toast.warning(`${result.inserted} importados, ${result.errors.length} con errores`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Error al importar el archivo");
    },
  });
}

export function downloadTemplate(entity: ImportEntity) {
  const names: Record<ImportEntity, string> = {
    clients:  "plantilla_clientes.xlsx",
    products: "plantilla_productos.xlsx",
    invoices: "plantilla_facturas.xlsx",
  };
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const url = `${baseUrl}/import/template/${entity}`;
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.blob())
    .then((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = names[entity];
      link.click();
      URL.revokeObjectURL(link.href);
    })
    .catch(() => toast.error("No se pudo descargar la plantilla"));
}
