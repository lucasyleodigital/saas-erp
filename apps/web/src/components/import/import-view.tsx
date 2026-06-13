"use client";

import { useRef, useState } from "react";
import {
  useImportFile,
  downloadTemplate,
  type ImportEntity,
  type ImportResult,
} from "@/hooks/use-import";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Upload,
  Download,
  Users,
  Package,
  FileText,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  X,
  FileSpreadsheet,
} from "lucide-react";

const ENTITIES: {
  key: ImportEntity;
  label: string;
  icon: any;
  description: string;
  fields: string[];
}[] = [
  {
    key: "clients",
    label: "Clientes",
    icon: Users,
    description: "Importa tu cartera de clientes desde otro CRM o ERP.",
    fields: ["Nombre*", "Email", "Teléfono", "CIF/NIF", "Dirección", "Ciudad", "Provincia", "Código postal", "País", "Web", "Notas"],
  },
  {
    key: "products",
    label: "Productos",
    icon: Package,
    description: "Importa tu catálogo de productos o servicios.",
    fields: ["Nombre*", "SKU", "Descripción", "Precio*", "Coste", "Tipo (SERVICE/DIGITAL/PHYSICAL)", "Control stock (SI/NO)"],
  },
  {
    key: "invoices",
    label: "Facturas históricas",
    icon: FileText,
    description: "Importa facturas de ejercicios anteriores para tener el historial completo.",
    fields: ["Número*", "Cliente*", "Fecha emisión*", "Fecha vencimiento", "Total*", "Estado (PAID/SENT/DRAFT)", "Descripción", "Notas"],
  },
];

function DropZone({
  onFile,
  isPending,
}: {
  onFile: (f: File) => void;
  isPending: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/30",
        isPending && "pointer-events-none opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { onFile(file); e.target.value = ""; }
        }}
      />
      <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
      <p className="font-medium text-sm">
        {isPending ? "Procesando archivo..." : "Arrastra tu archivo aquí o haz clic para seleccionar"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Formatos admitidos: .xlsx, .xls, .csv — máximo 5 MB
      </p>
    </div>
  );
}

function ResultCard({ result, onClear }: { result: ImportResult; onClear: () => void }) {
  const hasErrors = result.errors.length > 0;
  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{result.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total filas</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-5 w-5" />
              {result.inserted}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Importados</p>
          </CardContent>
        </Card>
        <Card className={hasErrors ? "border-red-200 dark:border-red-800" : "border-amber-200 dark:border-amber-800"}>
          <CardContent className="p-4 text-center">
            <p className={cn(
              "text-2xl font-bold flex items-center justify-center gap-1",
              hasErrors ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
            )}>
              {hasErrors ? <AlertCircle className="h-5 w-5" /> : <SkipForward className="h-5 w-5" />}
              {hasErrors ? result.errors.length : result.skipped}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasErrors ? "Con errores" : "Omitidos (ya existían)"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error table */}
      {result.errors.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Errores de importación ({result.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Fila</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Campo</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-mono text-red-600 dark:text-red-400">{err.row}</td>
                      <td className="px-4 py-2 font-medium">{err.field}</td>
                      <td className="px-4 py-2 text-muted-foreground">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" size="sm" onClick={onClear} className="gap-2">
        <X className="h-3 w-3" />
        Nueva importación
      </Button>
    </div>
  );
}

export function ImportView() {
  const [activeEntity, setActiveEntity] = useState<ImportEntity>("clients");
  const [result, setResult] = useState<ImportResult | null>(null);
  const importFile = useImportFile(activeEntity);

  const entity = ENTITIES.find((e) => e.key === activeEntity)!;

  function handleTabChange(key: ImportEntity) {
    setActiveEntity(key);
    setResult(null);
    importFile.reset();
  }

  async function handleFile(file: File) {
    setResult(null);
    const res = await importFile.mutateAsync(file).catch(() => null);
    if (res) setResult(res);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          Importar datos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Migra tus datos desde otro software usando plantillas Excel
        </p>
      </div>

      {/* Entity tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {ENTITIES.map((e) => {
          const Icon = e.icon;
          return (
            <button
              key={e.key}
              onClick={() => handleTabChange(e.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
                activeEntity === e.key
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {e.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Step 1 — Download template */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
              Descarga la plantilla Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{entity.description}</p>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {entity.fields.map((f) => (
                <span key={f} className={cn(
                  "rounded-md px-2 py-0.5 border",
                  f.endsWith("*")
                    ? "border-primary/30 bg-primary/5 text-primary font-medium"
                    : "border-border bg-muted/30 text-muted-foreground",
                )}>
                  {f}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Los campos con <span className="text-primary font-medium">*</span> son obligatorios.
              Rellena la plantilla con tus datos y sube el archivo en el paso 2.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadTemplate(activeEntity)}
            >
              <Download className="h-4 w-4" />
              Descargar plantilla {entity.label.toLowerCase()}.xlsx
            </Button>
          </CardContent>
        </Card>

        {/* Step 2 — Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
              Sube tu archivo relleno
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <ResultCard result={result} onClear={() => setResult(null)} />
            ) : (
              <DropZone onFile={handleFile} isPending={importFile.isPending} />
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-sm text-blue-700 dark:text-blue-300 space-y-1.5">
            <p className="font-medium">Consejos para una importación sin errores</p>
            <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-400 list-disc pl-4">
              <li>No modifiques los nombres de las columnas de la plantilla</li>
              <li>Los registros que ya existen (mismo nombre) se omiten automáticamente</li>
              <li>Las fechas deben ir en formato AAAA-MM-DD (ej: 2024-01-15)</li>
              <li>Los precios usan punto como separador decimal (ej: 1210.00)</li>
              <li>Máximo 5 MB por archivo — divide en lotes si tienes muchos registros</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
