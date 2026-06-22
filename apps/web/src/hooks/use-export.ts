import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type ExportEntity = "clients" | "products" | "invoices" | "suppliers";

const FILE_NAMES: Record<ExportEntity, string> = {
  clients:   "clientes.xlsx",
  products:  "productos.xlsx",
  invoices:  "facturas.xlsx",
  suppliers: "proveedores.xlsx",
};

export function useExport(entity: ExportEntity) {
  const [isPending, setIsPending] = useState(false);

  async function exportData() {
    setIsPending(true);
    try {
      const res = await api.get(`/export/${entity}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = FILE_NAMES[entity];
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Archivo descargado");
    } catch {
      toast.error("Error al exportar los datos");
    } finally {
      setIsPending(false);
    }
  }

  return { exportData, isPending };
}
