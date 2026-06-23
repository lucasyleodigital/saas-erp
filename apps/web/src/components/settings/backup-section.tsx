"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HardDrive, Download, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function BackupSection() {
  const [downloading, setDownloading] = useState(false);
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

      toast.success("Backup descargado correctamente");
    } catch {
      toast.error("Error al descargar el backup");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HardDrive className="h-6 w-6" />
          Backup
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Descarga y gestiona copias de seguridad de tus datos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup completo
          </CardTitle>
          <CardDescription>
            Descarga todos los datos de tu empresa en formato JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastBackup && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>
                Ultimo backup:{" "}
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
                Descargando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
