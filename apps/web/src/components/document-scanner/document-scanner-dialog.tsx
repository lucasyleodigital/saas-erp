"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, Loader2, X as XIcon, Paperclip, FileText, Receipt,
  Truck, Building2, CheckCircle2, Sparkles, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalyzeExpense, useCreateExpense } from "@/hooks/use-fiscal";
import { useCreateSupplier } from "@/hooks/use-suppliers";
import { toast } from "sonner";

type DocType = "GASTO" | "FACTURA_VENTA" | "ALBARAN" | "PROVEEDOR" | "OTRO";

interface ScanResult {
  documentType: DocType;
  aiProvider: string;
  attachmentUrl: string | null;
  extracted: {
    date?: string; description?: string; supplier?: string;
    supplierNif?: string; invoiceRef?: string; subtotal?: number;
    vatRate?: number; category?: string; clientName?: string; clientNif?: string;
  };
}

const DOC_TYPE_CONFIG: Record<DocType, { label: string; icon: React.ElementType; color: string; badge: string }> = {
  GASTO:         { label: "Gasto / Ticket", icon: Receipt,   color: "text-orange-500", badge: "bg-orange-100 text-orange-700" },
  FACTURA_VENTA: { label: "Factura de Venta", icon: FileText, color: "text-blue-500",   badge: "bg-blue-100 text-blue-700" },
  ALBARAN:       { label: "Albarán",         icon: Truck,    color: "text-green-500",  badge: "bg-green-100 text-green-700" },
  PROVEEDOR:     { label: "Proveedor",       icon: Building2, color: "text-purple-500", badge: "bg-purple-100 text-purple-700" },
  OTRO:          { label: "Otro documento",  icon: FileText, color: "text-gray-500",   badge: "bg-gray-100 text-gray-700" },
};

const AI_PROVIDER_LABEL: Record<string, string> = {
  "nvidia-nim": "NVIDIA NIM (Llama 4)",
  "claude":     "Claude Haiku",
  "none":       "Sin IA",
};

function Field({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between text-sm py-1 border-b border-muted last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{String(value)}</span>
    </div>
  );
}

export function DocumentScannerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const analyze = useAnalyzeExpense();
  const createExpense = useCreateExpense();
  const createSupplier = useCreateSupplier();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setFileName(null);
    setResult(null);
    setSaving(false);
  }

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setResult(null);
    try {
      const res = await analyze.mutateAsync(file);
      setResult(res as ScanResult);
    } catch {
      setFileName(null);
    }
  }, [analyze]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleAction() {
    if (!result) return;
    setSaving(true);
    const ex = result.extracted;

    try {
      if (result.documentType === "GASTO") {
        await createExpense.mutateAsync({
          date: ex.date ?? new Date().toISOString().split("T")[0],
          description: ex.description ?? "",
          supplier: ex.supplier ?? "",
          supplierNif: ex.supplierNif ?? "",
          invoiceRef: ex.invoiceRef ?? "",
          subtotal: ex.subtotal ? String(ex.subtotal) : "",
          vatRate: ex.vatRate !== undefined ? String(ex.vatRate) : "21",
          withholdingRate: "",
          category: ex.category ?? "OTROS",
          attachmentUrl: result.attachmentUrl ?? "",
        });
        toast.success("Gasto registrado correctamente");
        onOpenChange(false);
        reset();

      } else if (result.documentType === "PROVEEDOR") {
        await createSupplier.mutateAsync({
          name: ex.supplier ?? "",
          taxId: ex.supplierNif ?? "",
          email: "",
          phone: "",
          address: "",
        });
        toast.success("Proveedor creado correctamente");
        onOpenChange(false);
        reset();

      } else if (result.documentType === "FACTURA_VENTA") {
        // Navigate to invoices with pre-fill via query params
        const params = new URLSearchParams();
        if (ex.clientName) params.set("clientName", ex.clientName);
        if (ex.clientNif)  params.set("clientNif", ex.clientNif);
        if (ex.invoiceRef) params.set("ref", ex.invoiceRef);
        if (ex.date)       params.set("date", ex.date);
        if (ex.subtotal)   params.set("subtotal", String(ex.subtotal));
        toast.info("Redirigiendo a Facturas...");
        onOpenChange(false);
        reset();
        router.push(`/facturas?scan=1&${params.toString()}`);

      } else if (result.documentType === "ALBARAN") {
        const params = new URLSearchParams();
        if (ex.supplier)    params.set("supplier", ex.supplier);
        if (ex.invoiceRef)  params.set("ref", ex.invoiceRef);
        if (ex.date)        params.set("date", ex.date);
        toast.info("Redirigiendo a Albaranes...");
        onOpenChange(false);
        reset();
        router.push(`/albaranes?scan=1&${params.toString()}`);

      } else {
        toast.info("Documento registrado. Revisa los datos extraídos.");
        onOpenChange(false);
        reset();
      }
    } catch {
      toast.error("Error al guardar el documento");
    } finally {
      setSaving(false);
    }
  }

  const docConfig = result ? DOC_TYPE_CONFIG[result.documentType] : null;
  const DocIcon = docConfig?.icon ?? FileText;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Escanear documento con IA
          </DialogTitle>
        </DialogHeader>

        {/* Upload zone */}
        {!result && (
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/40",
              analyze.isPending && "pointer-events-none opacity-60",
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {analyze.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm font-medium text-primary">Analizando con IA...</p>
                {fileName && <p className="text-xs text-muted-foreground truncate max-w-[260px]">{fileName}</p>}
              </div>
            ) : fileName ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Paperclip className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary truncate max-w-[240px]">{fileName}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="text-muted-foreground hover:text-destructive ml-1">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Sube o arrastra el documento</p>
                <p className="text-xs text-muted-foreground">Factura, ticket, albarán, ficha de proveedor...</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, PDF • Máx. 10 MB</p>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Header: tipo detectado + motor IA */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DocIcon className={cn("h-5 w-5", docConfig?.color)} />
                <Badge className={cn("text-xs font-medium", docConfig?.badge)}>
                  {docConfig?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                {AI_PROVIDER_LABEL[result.aiProvider] ?? result.aiProvider}
              </div>
            </div>

            {/* Datos extraídos */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-0.5">
              <Field label="Fecha"         value={result.extracted.date} />
              <Field label="Proveedor"     value={result.extracted.supplier} />
              <Field label="NIF Proveedor" value={result.extracted.supplierNif} />
              <Field label="Cliente"       value={result.extracted.clientName} />
              <Field label="NIF Cliente"   value={result.extracted.clientNif} />
              <Field label="Nº Referencia" value={result.extracted.invoiceRef} />
              <Field label="Descripción"   value={result.extracted.description} />
              <Field label="Base imponible" value={result.extracted.subtotal !== undefined ? `${result.extracted.subtotal} €` : undefined} />
              <Field label="IVA"           value={result.extracted.vatRate !== undefined ? `${result.extracted.vatRate}%` : undefined} />
              <Field label="Categoría"     value={result.extracted.category} />
              {result.attachmentUrl && (
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-muted-foreground">Adjunto</span>
                  <a href={result.attachmentUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline">
                    Ver archivo <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Acción según tipo */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={reset}>
                Escanear otro
              </Button>
              <Button size="sm" className="flex-1" onClick={handleAction} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {result.documentType === "GASTO"         && "Registrar gasto"}
                {result.documentType === "FACTURA_VENTA" && <>Ir a Facturas <ExternalLink className="h-3 w-3 ml-1" /></>}
                {result.documentType === "ALBARAN"       && <>Ir a Albaranes <ExternalLink className="h-3 w-3 ml-1" /></>}
                {result.documentType === "PROVEEDOR"     && "Crear proveedor"}
                {result.documentType === "OTRO"          && "Cerrar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
