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
import { useTranslations } from "next-intl";

export function BackupSection() {
  const t = useTranslations("backup");
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

      toast.success(t("downloadSuccess"));
    } catch {
      toast.error(t("downloadError"));
    } finally {
      setDownloading(false);
    }
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
    </div>
  );
}
