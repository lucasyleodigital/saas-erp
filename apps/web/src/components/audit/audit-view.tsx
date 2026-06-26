"use client";

import { useState } from "react";
import { useAuditLog } from "@/hooks/use-audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import {
  Shield,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

const ENTITY_VALUES = [
  { value: "ALL", key: "all" },
  { value: "Invoice", key: "invoices" },
  { value: "Client", key: "clients" },
  { value: "Product", key: "products" },
  { value: "Quote", key: "quotes" },
  { value: "Employee", key: "employees" },
  { value: "Project", key: "projects" },
  { value: "DeliveryNote", key: "deliveryNotes" },
  { value: "Order", key: "orders" },
  { value: "Supplier", key: "suppliers" },
];

const ACTION_VALUES = [
  { value: "ALL", key: "all" },
  { value: "CREATE", key: "create" },
  { value: "UPDATE", key: "update" },
  { value: "DELETE", key: "delete" },
];

const ACTION_BADGE_VARIANTS: Record<string, { key: string; variant: "success" | "info" | "destructive" }> = {
  CREATE: { key: "create",  variant: "success" },
  UPDATE: { key: "update",  variant: "info" },
  DELETE: { key: "delete",  variant: "destructive" },
};

export function AuditView() {
  const t = useTranslations("audit");
  const tCommon = useTranslations("common");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const params: Record<string, any> = { page, limit: 30 };
  if (entityFilter !== "ALL") params.entity = entityFilter;
  if (actionFilter !== "ALL") params.action = actionFilter;
  if (dateFrom) params.from = dateFrom;
  if (dateTo) params.to = dateTo;

  const { data, isLoading, isError } = useAuditLog(params);

  const logs = data?.data ?? (Array.isArray(data) ? data : []);
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Entidad" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_VALUES.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {t(`entities.${e.key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Accion" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_VALUES.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {t(`actions.${a.key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-40"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-40"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="font-medium text-destructive">
                {t("errorLoading")}
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">{t("noResults")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("noResultsDesc")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      {t("table.dateTime")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                      {t("table.user")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      {t("table.action")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      {t("table.entity")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                      {t("table.id")}
                    </th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {logs.map((log: any, i: number) => {
                      const abDef = ACTION_BADGE_VARIANTS[log.action] ?? {
                        key: log.action,
                        variant: "info" as const,
                      };
                      const isExpanded = expandedRow === log.id;
                      const hasDetail =
                        log.oldData || log.newData || log.changes;

                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.015 }}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors align-top"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">
                                {formatDate(log.createdAt ?? log.timestamp)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  log.createdAt ?? log.timestamp
                                ).toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {log.user?.name ??
                              log.userName ??
                              log.userId ??
                              t("system")}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={abDef.variant}>{t(`actions.${abDef.key}`)}</Badge>
                          </td>
                          <td className="px-4 py-3">{log.entity ?? log.entityType}</td>
                          <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-muted-foreground">
                            {(log.entityId ?? log.recordId ?? "").slice(0, 8)}...
                          </td>
                          <td className="px-4 py-3">
                            {hasDetail && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  setExpandedRow(
                                    isExpanded ? null : log.id
                                  )
                                }
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </td>
                          {/* Expanded detail row handled below */}
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>

              {/* Expanded details (separate from table for simplicity) */}
              {expandedRow && (
                <ExpandedDetail
                  log={logs.find((l: any) => l.id === expandedRow)}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("pageOf", { page, totalPages })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {tCommon("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {tCommon("next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpandedDetail({ log }: { log: any }) {
  const t = useTranslations("audit");
  if (!log) return null;

  const oldData = log.oldData;
  const newData = log.newData;
  const changes = log.changes;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-border bg-muted/20 px-6 py-4"
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {t("detail.title")}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {oldData && (
          <div>
            <p className="text-xs font-medium mb-1">{t("detail.oldData")}</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
              {JSON.stringify(oldData, null, 2)}
            </pre>
          </div>
        )}
        {newData && (
          <div>
            <p className="text-xs font-medium mb-1">{t("detail.newData")}</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
              {JSON.stringify(newData, null, 2)}
            </pre>
          </div>
        )}
        {changes && !oldData && !newData && (
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-1">{t("detail.changes")}</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
              {JSON.stringify(changes, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </motion.div>
  );
}
