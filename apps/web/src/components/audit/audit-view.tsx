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

const ENTITIES = [
  { value: "ALL", label: "Todas las entidades" },
  { value: "Invoice", label: "Facturas" },
  { value: "Client", label: "Clientes" },
  { value: "Product", label: "Productos" },
  { value: "Quote", label: "Presupuestos" },
  { value: "Employee", label: "Empleados" },
  { value: "Project", label: "Proyectos" },
  { value: "DeliveryNote", label: "Albaranes" },
  { value: "Order", label: "Pedidos" },
  { value: "Supplier", label: "Proveedores" },
];

const ACTIONS = [
  { value: "ALL", label: "Todas las acciones" },
  { value: "CREATE", label: "Crear" },
  { value: "UPDATE", label: "Actualizar" },
  { value: "DELETE", label: "Eliminar" },
];

const ACTION_BADGE: Record<string, { label: string; variant: "success" | "info" | "destructive" }> = {
  CREATE: { label: "Crear",      variant: "success" },
  UPDATE: { label: "Actualizar", variant: "info" },
  DELETE: { label: "Eliminar",   variant: "destructive" },
};

export function AuditView() {
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
          Registro de actividad
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historial completo de cambios en el sistema
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Entidad" />
          </SelectTrigger>
          <SelectContent>
            {ENTITIES.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Accion" />
          </SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
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
                Error al cargar el registro
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">Sin registros</p>
              <p className="text-sm text-muted-foreground mt-1">
                No se encontraron entradas de auditoria con estos filtros
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Fecha/hora
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                      Usuario
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Accion
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Entidad
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                      ID
                    </th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {logs.map((log: any, i: number) => {
                      const ab = ACTION_BADGE[log.action] ?? {
                        label: log.action,
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
                              "Sistema"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={ab.variant}>{ab.label}</Badge>
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
            Pagina {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpandedDetail({ log }: { log: any }) {
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
        Detalles del cambio
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {oldData && (
          <div>
            <p className="text-xs font-medium mb-1">Datos anteriores</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
              {JSON.stringify(oldData, null, 2)}
            </pre>
          </div>
        )}
        {newData && (
          <div>
            <p className="text-xs font-medium mb-1">Datos nuevos</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
              {JSON.stringify(newData, null, 2)}
            </pre>
          </div>
        )}
        {changes && !oldData && !newData && (
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-1">Cambios</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
              {JSON.stringify(changes, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </motion.div>
  );
}
