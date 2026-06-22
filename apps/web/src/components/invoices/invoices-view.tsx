"use client";

import { useState } from "react";
import { useInvoices, useUpdateInvoiceStatus, useSendInvoiceEmail, useDeleteInvoice } from "@/hooks/use-invoices";
import { downloadInvoicePdf } from "@/lib/pdf/download-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceDialog } from "./invoice-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function InvoicesView() {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const STATUS_TABS = [
    { key: undefined,  label: tCommon("all") },
    { key: "DRAFT",    label: tCommon("draft") },
    { key: "SENT",     label: tCommon("sent") },
    { key: "PAID",     label: tCommon("paid") },
    { key: "OVERDUE",  label: tCommon("overdue") },
  ];

  const statusConfig: Record<string, { label: string; variant: "success" | "info" | "destructive" | "secondary" | "warning" }> = {
    DRAFT:     { label: tCommon("draft"),     variant: "secondary" },
    SENT:      { label: tCommon("sent"),      variant: "info" },
    PAID:      { label: tCommon("paid"),      variant: "success" },
    PARTIAL:   { label: tCommon("partial"),   variant: "warning" },
    OVERDUE:   { label: tCommon("overdue"),   variant: "destructive" },
    CANCELLED: { label: tCommon("cancelled"), variant: "secondary" },
  };

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const updateStatus = useUpdateInvoiceStatus();
  const sendEmail = useSendInvoiceEmail();
  const deleteInvoice = useDeleteInvoice();

  const { data, isLoading, isError, error } = useInvoices({
    search: debouncedSearch || undefined,
    status,
    page,
    limit: 20,
  });

  const invoices = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                status === tab.key
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar facturas..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="font-medium text-destructive">Error al cargar facturas</p>
              <p className="text-sm text-muted-foreground mt-1 mb-2 max-w-md">
                {(error as any)?.response?.status === 401
                  ? "Sesion expirada — cierra sesion y vuelve a entrar"
                  : (error as any)?.message ?? "No se pudo conectar con el servidor"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {(error as any)?.response?.status && `HTTP ${(error as any).response.status}`}
                {(error as any)?.config?.baseURL && ` — ${(error as any).config.baseURL}`}
              </p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No hay facturas</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Crea tu primera factura para empezar
              </p>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva factura
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Número</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Cliente</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Fecha</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Vencimiento</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Importe</th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-3">Estado</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any, i: number) => {
                    const config = statusConfig[inv.status] ?? { label: inv.status, variant: "secondary" as const };
                    return (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                          {inv.number}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{inv.client?.name}</p>
                          {inv.client?.cifNif && (
                            <p className="text-xs text-muted-foreground">{inv.client.cifNif}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          {formatDate(inv.issueDate)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {inv.dueDate ? (
                            <span className={cn(
                              "text-sm",
                              new Date(inv.dueDate) < new Date() && inv.status !== "PAID"
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            )}>
                              {formatDate(inv.dueDate)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold">{formatCurrency(Number(inv.total))}</span>
                          {inv.status === "PARTIAL" && (
                            <p className="text-xs text-muted-foreground">
                              Cobrado: {formatCurrency(Number(inv.paidAmount))}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/facturas/${inv.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver factura
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={pdfLoading === inv.id}
                                onClick={async () => {
                                  setPdfLoading(inv.id);
                                  try { await downloadInvoicePdf(inv.id); }
                                  catch { toast.error("Error al generar PDF"); }
                                  finally { setPdfLoading(null); }
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {pdfLoading === inv.id ? "Generando..." : "Descargar PDF"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => sendEmail.mutate(inv.id)}
                                disabled={sendEmail.isPending}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Enviar por email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {inv.status === "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ id: inv.id, status: "SENT" })
                                  }
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Marcar como enviada
                                </DropdownMenuItem>
                              )}
                              {["SENT", "PARTIAL", "OVERDUE"].includes(inv.status) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ id: inv.id, status: "PAID" })
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como pagada
                                </DropdownMenuItem>
                              )}
                              {inv.status !== "CANCELLED" && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    updateStatus.mutate({ id: inv.id, status: "CANCELLED" })
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                              {(inv.status === "DRAFT" || inv.status === "CANCELLED") && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      if (confirm(`Eliminar factura ${inv.number}? Esta accion no se puede deshacer.`)) {
                                        deleteInvoice.mutate(inv.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <InvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
