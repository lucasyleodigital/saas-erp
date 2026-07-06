"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HardDrive, Download, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function BackupSection() {
  const t = useTranslations("backup");
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lastBackupDate");
    }
    return null;
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const response = await api.get("/backup", { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      a.download = `backup-youwhole-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem("lastBackupDate", now);
      setLastBackup(now);

      toast.success(t("downloadSuccess"));
    } catch {
      toast.error(t("downloadError"));
    } finally {
      setDownloading(false);
    }
  }

  async function handleRestore(file: File) {
    setRestoring(true);
    setConfirmRestore(false);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await api.post("/backup/restore", json);
      toast.success("Backup restaurado correctamente. Recarga la página para ver los cambios.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Error al restaurar el backup";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      toast.error("El archivo debe ser un .json exportado desde YouWhole");
      return;
    }
    handleRestore(file);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HardDrive className="h-6 w-6" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("fullBackup")}
          </CardTitle>
          <CardDescription>
            {t("fullBackupDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastBackup && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>
                {t("lastBackup")}:{" "}
                {new Date(lastBackup).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("downloading")}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t("download")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restaurar backup
          </CardTitle>
          <CardDescription>
            Sube un archivo de backup exportado desde YouWhole para restaurar los datos. Los registros existentes se actualizarán y los nuevos se crearán.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Esta acción sobreescribirá los datos existentes con los del archivo. Se recomienda hacer un backup previo antes de restaurar.</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          {!confirmRestore ? (
            <Button
              variant="outline"
              onClick={() => setConfirmRestore(true)}
              disabled={restoring}
              className="gap-2 border-amber-500/50 hover:bg-amber-500/10"
            >
              <Upload className="h-4 w-4" />
              Seleccionar archivo de backup
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">¿Confirmas que quieres restaurar?</span>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={restoring}
                className="gap-2"
              >
                {restoring ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {restoring ? "Restaurando..." : "Sí, seleccionar archivo"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmRestore(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
