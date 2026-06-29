"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, AlertCircle, ChevronLeft } from "lucide-react";
import type { FieldDef, PreviewResult } from "@/hooks/use-import";
import { useTranslations } from "next-intl";

interface Props {
  preview: PreviewResult;
  fileName: string;
  onConfirm: (mapping: Record<string, string>) => void;
  onBack: () => void;
  isPending: boolean;
}

export function ColumnMapper({ preview, fileName, onConfirm, onBack, isPending }: Props) {
  const t = useTranslations("columnMapper");
  const { columns, sample, suggestions, fields } = preview;
  const [mapping, setMapping] = useState<Record<string, string>>(suggestions);

  const requiredUnmapped = fields.filter(f => f.required && !mapping[f.key]);
  const canImport = requiredUnmapped.length === 0;

  // Which source columns are already used (to highlight duplicates)
  const usedCols = Object.values(mapping).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            {t("columnsDetected", { count: columns.length })} · {sample.length > 0 ? t("sampleRows", { count: sample.length }) : t("noData")}
          </p>
        </div>
      </div>

      {/* Mapping table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("mapTitle")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("mapHint")}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-4 py-2 w-1/3">{t("systemField")}</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-2 w-1/3">{t("sourceColumn")}</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-2 w-1/3">{t("sampleValue")}</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => {
                  const mapped = mapping[field.key] || "";
                  const preview = mapped ? sample[0]?.[mapped] ?? "" : "";
                  const isMapped = Boolean(mapped);
                  return (
                    <tr key={field.key} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label}</span>
                          {field.required && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/40 text-primary">
                              {t("required")}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={mapped}
                          onChange={(e) =>
                            setMapping((m) => ({ ...m, [field.key]: e.target.value }))
                          }
                          className={cn(
                            "w-full rounded-md border px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring",
                            field.required && !isMapped
                              ? "border-red-400 focus:ring-red-300"
                              : "border-border",
                          )}
                        >
                          <option value="">{t("noMap")}</option>
                          {columns.map((col) => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        {isMapped ? (
                          <span className={cn(
                            "font-mono text-xs rounded px-1.5 py-0.5",
                            preview
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground",
                          )}>
                            {preview || t("empty")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Validation alerts */}
      {requiredUnmapped.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            {t("unmappedRequired", { fields: requiredUnmapped.map((f) => f.label).join(", ") })}
          </span>
        </div>
      )}

      {canImport && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{t("allReady")}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => onConfirm(mapping)}
          disabled={!canImport || isPending}
          className="gap-2"
        >
          {isPending ? t("importing") : t("import")}
          {!isPending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
