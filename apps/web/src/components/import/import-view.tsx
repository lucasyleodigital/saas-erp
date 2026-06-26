"use client";

import { useRef, useState } from "react";
import {
  usePreviewImport,
  useImportFile,
  downloadTemplate,
  type ImportEntity,
  type ImportResult,
  type PreviewResult,
} from "@/hooks/use-import";
import { ColumnMapper } from "./column-mapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Upload, Download, Users, Package, FileText, Truck,
  CheckCircle2, AlertCircle, SkipForward, X, FileSpreadsheet, ArrowRight,
} from "lucide-react";
import { LocaleLink as Link } from "@/components/ui/locale-link";

const ENTITIES: {
  key: ImportEntity; label: string; icon: any; description: string; fields: string[]; href: string;
}[] = [
  { key: "clients",   label: "Clientes",           icon: Users,    href: "/clientes",  description: "Importa tu cartera de clientes desde otro CRM o ERP.",                             fields: ["Nombre*","Email","Teléfono","CIF/NIF","Dirección","Ciudad","Provincia","Código postal","País","Web","Notas"] },
  { key: "products",  label: "Productos",           icon: Package,  href: "/productos", description: "Importa tu catálogo de productos o servicios.",                                    fields: ["Nombre*","SKU","Descripción","Precio*","Coste","Tipo (SERVICE/DIGITAL/PHYSICAL)","Control stock (SI/NO)"] },
  { key: "suppliers", label: "Proveedores",         icon: Truck,    href: "/proveedores", description: "Importa tu directorio de proveedores y subcontratistas.",                       fields: ["Nombre*","Email","Teléfono","CIF/NIF","Persona contacto","Dirección","Ciudad","País","Web","IBAN / Cuenta","Notas"] },
  { key: "invoices",  label: "Facturas históricas", icon: FileText, href: "/facturas",  description: "Importa facturas de ejercicios anteriores para tener el historial completo.",     fields: ["Número*","Cliente*","Fecha emisión","Fecha vencimiento","Base imponible","Importe IVA","Importe IRPF","Total*","Estado (PAID/SENT/DRAFT)","Descripción","Notas"] },
];

type Step = "idle" | "previewing" | "mapping" | "importing" | "done";

function DropZone({ onFile, isPending }: { onFile: (f: File) => void; isPending: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      onClick={() => inputRef.current?.click()}
      className={cn("border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors", dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30", isPending && "pointer-events-none opacity-60")}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.json" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = ""; } }} />
      <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
      <p className="font-medium text-sm">{isPending ? "Analizando archivo..." : "Arrastra tu archivo aquí o haz clic para seleccionar"}</p>
      <p className="text-xs text-muted-foreground mt-1">Formatos admitidos: .xlsx, .xls, .csv, .json — máximo 5 MB</p>
    </div>
  );
}

function ResultCard({ result, onClear, entityHref, entityLabel }: { result: ImportResult; onClear: () => void; entityHref: string; entityLabel: string }) {
  const hasErrors = result.errors.length > 0;
  const totalVisible = result.inserted + result.skipped;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-xl sm:text-2xl font-bold">{result.total}</p><p className="text-xs text-muted-foreground mt-0.5">Total filas</p></CardContent></Card>
        <Card className="border-emerald-200 dark:border-emerald-800"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1"><CheckCircle2 className="h-5 w-5" />{result.inserted}</p><p className="text-xs text-muted-foreground mt-0.5">Importados</p></CardContent></Card>
        <Card className={hasErrors ? "border-red-200 dark:border-red-800" : "border-amber-200 dark:border-amber-800"}>
          <CardContent className="p-4 text-center">
            <p className={cn("text-2xl font-bold flex items-center justify-center gap-1", hasErrors ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>
              {hasErrors ? <AlertCircle className="h-5 w-5" /> : <SkipForward className="h-5 w-5" />}
              {hasErrors ? result.errors.length : result.skipped}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{hasErrors ? "Con errores" : "Omitidos (ya existían)"}</p>
          </CardContent>
        </Card>
      </div>
      {result.errors.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><AlertCircle className="h-4 w-4" />Errores de importación ({result.errors.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background border-b border-border"><tr><th className="text-left px-4 py-2 font-medium text-muted-foreground">Fila</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Campo</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Error</th></tr></thead>
                <tbody>{result.errors.map((err, i) => (<tr key={i} className="border-b border-border last:border-0"><td className="px-4 py-2 font-mono text-red-600 dark:text-red-400">{err.row}</td><td className="px-4 py-2 font-medium">{err.field}</td><td className="px-4 py-2 text-muted-foreground">{err.message}</td></tr>))}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center gap-2">
        {totalVisible > 0 && (
          <Button asChild size="sm" className="gap-2">
            <Link href={entityHref}>
              <ArrowRight className="h-3.5 w-3.5" />
              Ver {entityLabel.toLowerCase()}
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onClear} className="gap-2"><X className="h-3 w-3" />Nueva importación</Button>
      </div>
    </div>
  );
}

export function ImportView() {
  const [activeEntity, setActiveEntity] = useState<ImportEntity>("clients");
  const [step, setStep]                 = useState<Step>("idle");
  const [pendingFile, setPendingFile]   = useState<File | null>(null);
  const [preview, setPreview]           = useState<PreviewResult | null>(null);
  const [result, setResult]             = useState<ImportResult | null>(null);

  const previewMutation = usePreviewImport(activeEntity);
  const importMutation  = useImportFile(activeEntity);
  const entity = ENTITIES.find((e) => e.key === activeEntity)!;

  function reset() {
    setStep("idle"); setPendingFile(null); setPreview(null); setResult(null);
    previewMutation.reset(); importMutation.reset();
  }

  function handleTabChange(key: ImportEntity) { setActiveEntity(key); reset(); }

  async function handleFile(file: File) {
    setPendingFile(file);
    setStep("previewing");
    try {
      const data = await previewMutation.mutateAsync(file);
      setPreview(data);
      setStep("mapping");
    } catch { setStep("idle"); setPendingFile(null); }
  }

  async function handleConfirmMapping(mapping: Record<string, string>) {
    if (!pendingFile) return;
    setStep("importing");
    try {
      const res = await importMutation.mutateAsync({ file: pendingFile, mapping });
      setResult(res); setStep("done");
    } catch { setStep("mapping"); }
  }

  const stepLabel = step === "mapping" ? "Mapea las columnas" : step === "done" ? "Resultado" : "Sube tu archivo";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Upload className="h-6 w-6 text-primary" />Importar datos</h1>
        <p className="text-sm text-muted-foreground mt-1">Migra tus datos desde otro software. Acepta Excel, CSV y JSON con cualquier nombre de columna.</p>
      </div>

      {/* Entity tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {ENTITIES.map((e) => { const Icon = e.icon; return (
          <button key={e.key} onClick={() => handleTabChange(e.key)} className={cn("flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors", activeEntity === e.key ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground")}>
            <Icon className="h-4 w-4" />{e.label}
          </button>
        ); })}
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
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
                <span key={f} className={cn("rounded-md px-2 py-0.5 border", f.endsWith("*") ? "border-primary/30 bg-primary/5 text-primary font-medium" : "border-border bg-muted/30 text-muted-foreground")}>{f}</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Los campos con <span className="text-primary font-medium">*</span> son obligatorios.
              Si ya tienes un export propio (cualquier columna), súbelo directamente — el sistema te preguntará cómo mapearlo.
            </p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadTemplate(activeEntity)}>
              <Download className="h-4 w-4" />Descargar plantilla {entity.label.toLowerCase()}.xlsx
            </Button>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
              {stepLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === "done" && result ? (
              <ResultCard result={result} onClear={reset} entityHref={entity.href} entityLabel={entity.label} />
            ) : step === "mapping" && preview ? (
              <ColumnMapper
                preview={preview}
                fileName={pendingFile?.name ?? ""}
                onConfirm={handleConfirmMapping}
                onBack={reset}
                isPending={importMutation.isPending}
              />
            ) : (
              <DropZone onFile={handleFile} isPending={step === "previewing"} />
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-sm text-blue-700 dark:text-blue-300 space-y-1.5">
            <p className="font-medium">Consejos</p>
            <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-400 list-disc pl-4">
              <li>Puedes subir <strong>cualquier formato</strong> — el asistente de mapeo te guía para asignar columnas</li>
              <li>Los registros que ya existen (mismo nombre) se omiten automáticamente</li>
              <li>Las fechas aceptan formato ISO (2024-01-15) o español (15/01/2024)</li>
              <li>Los precios usan punto como separador decimal (ej: 1210.00)</li>
              <li>Máximo 5 MB — divide en lotes si tienes muchos registros</li>
              <li>JSON: array <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{"[{...}]"}</code> u objeto con clave <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">data</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">clientes</code>, etc.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
