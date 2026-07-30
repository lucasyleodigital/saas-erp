"use client";

import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useImportProducts } from "@/hooks/use-products";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedProduct {
  name: string;
  description?: string;
  sku?: string;
  type: "SERVICE" | "DIGITAL" | "PHYSICAL";
  price: number;
  error?: string;
}

const TYPE_MAP: Record<string, "SERVICE" | "DIGITAL" | "PHYSICAL"> = {
  servicio: "SERVICE", service: "SERVICE", srv: "SERVICE",
  digital: "DIGITAL", dig: "DIGITAL",
  fisico: "PHYSICAL", físico: "PHYSICAL", physical: "PHYSICAL", producto: "PHYSICAL",
};

function parseCSV(text: string): ParsedProduct[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(/[,;|\t]/).map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const nameIdx = header.findIndex((h) => ["nombre", "name", "producto", "servicio", "descripcion corta"].includes(h));
  const priceIdx = header.findIndex((h) => ["precio", "price", "pvp", "importe", "precio sin iva", "precio base"].includes(h));
  const typeIdx = header.findIndex((h) => ["tipo", "type", "categoria", "categoría"].includes(h));
  const descIdx = header.findIndex((h) => ["descripcion", "descripción", "description", "detalle", "detalles"].includes(h));
  const skuIdx = header.findIndex((h) => ["sku", "ref", "referencia", "codigo", "código"].includes(h));

  const ni = nameIdx >= 0 ? nameIdx : 0;
  const pi = priceIdx >= 0 ? priceIdx : 1;

  return lines.slice(1).map((line) => {
    const cols = line.split(/[,;|\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const name = cols[ni] ?? "";
    const rawPrice = cols[pi]?.replace(/[€$\s.]/g, "").replace(",", ".") ?? "0";
    const price = parseFloat(rawPrice) || 0;
    const rawType = typeIdx >= 0 ? (cols[typeIdx] ?? "").toLowerCase().trim() : "";
    const type = TYPE_MAP[rawType] ?? "SERVICE";
    const description = descIdx >= 0 ? cols[descIdx] : undefined;
    const sku = skuIdx >= 0 ? cols[skuIdx] : undefined;

    return {
      name,
      description: description || undefined,
      sku: sku || undefined,
      type,
      price,
      error: !name ? "Sin nombre" : price < 0 ? "Precio inválido" : undefined,
    };
  }).filter((p) => p.name);
}

const TYPE_LABELS: Record<string, string> = {
  SERVICE: "Servicio",
  DIGITAL: "Digital",
  PHYSICAL: "Físico",
};

const EXAMPLE_CSV = `nombre;precio;tipo;descripcion;sku
Consultoría estratégica;150;servicio;Sesión de consultoría de 1h;SRV-001
Diseño web;1200;servicio;Web corporativa completa;SRV-002
Pack redes sociales;299;servicio;Gestión mensual de RRSS;SRV-003`;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ImportProductsDialog({ open, onOpenChange }: Props) {
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportProducts();

  const valid = products.filter((p) => !p.error);
  const invalid = products.filter((p) => p.error);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setProducts(parseCSV(text));
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (!valid.length) return;
    await importMutation.mutateAsync(
      valid.map(({ error: _e, ...p }) => p as Record<string, unknown>),
    );
    onOpenChange(false);
    setProducts([]);
    setFileName("");
  }

  function downloadExample() {
    const blob = new Blob([EXAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ejemplo-productos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() { setProducts([]); setFileName(""); }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar productos / servicios desde CSV
          </DialogTitle>
        </DialogHeader>

        {products.length === 0 ? (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
              )}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Arrastra tu archivo CSV aquí</p>
              <p className="text-sm text-muted-foreground mt-1">o haz clic para seleccionarlo</p>
              <p className="text-xs text-muted-foreground mt-3">Separadores admitidos: coma (,) punto y coma (;) tabulador o barra (|)</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            {/* Instrucciones */}
            <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium text-sm">Columnas reconocidas (el orden no importa):</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span><strong>nombre</strong> — nombre del producto/servicio *</span>
                <span><strong>precio</strong> — precio sin IVA *</span>
                <span><strong>tipo</strong> — servicio / digital / fisico</span>
                <span><strong>descripcion</strong> — descripción larga</span>
                <span><strong>sku</strong> — referencia interna</span>
              </div>
              <p className="text-xs text-muted-foreground">* obligatorio · Si no hay columna "tipo" se asigna Servicio por defecto</p>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">¿No tienes CSV? Descarga el ejemplo y rellénalo.</p>
              <Button variant="outline" size="sm" onClick={downloadExample} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar ejemplo
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="gap-1 text-sm">
                <FileText className="h-3.5 w-3.5" />{fileName}
              </Badge>
              <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle2 className="h-3.5 w-3.5" />{valid.length} válidos
              </Badge>
              {invalid.length > 0 && (
                <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  <AlertCircle className="h-3.5 w-3.5" />{invalid.length} con error
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={reset} className="ml-auto text-xs">
                Cambiar archivo
              </Button>
            </div>

            {/* Tabla preview */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">Nombre</th>
                    <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">Tipo</th>
                    <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">Precio</th>
                    <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground hidden sm:table-cell">SKU</th>
                    <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i} className={cn(
                      "border-t transition-colors",
                      p.error ? "bg-red-50 dark:bg-red-950/20" : "hover:bg-muted/30",
                    )}>
                      <td className="px-3 py-2">
                        <span className={p.error ? "text-red-600 dark:text-red-400" : ""}>{p.name || "—"}</span>
                        {p.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{TYPE_LABELS[p.type]}</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {p.price.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">{p.sku ?? "—"}</td>
                      <td className="px-3 py-2 text-center">
                        {p.error
                          ? <AlertCircle className="h-3.5 w-3.5 text-red-500 mx-auto" title={p.error} />
                          : <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invalid.length > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                Las filas con error se omitirán. Solo se importarán los {valid.length} productos válidos.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {products.length > 0 && (
            <Button onClick={handleImport} disabled={importMutation.isPending || valid.length === 0}>
              {importMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Importar {valid.length} producto{valid.length !== 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
