"use client";

import { useState } from "react";
import {
  useQuotes,
  useUpdateQuoteStatus,
  useConvertQuoteToInvoice,
  useDeleteQuote,
  useSendQuoteEmail,
  useDuplicateQuote,
} from "@/hooks/use-quotes";
import { downloadQuotePdf } from "@/lib/pdf/download-pdf";
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
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Search,
  Plus,
  MoreHorizontal,
  FileText,
  CheckCircle,
  XCircle,
  Send,
  Trash2,
  ArrowRight,
  Download,
  Copy,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { QuoteDialog } from "./quote-dialog";
import { useTranslations } from "next-intl";

export function QuotesView() {
  const t = useTranslations("quotes");
  const tCommon = useTranslations("common");

  const STATUS_TABS = [
    { key: undefined,   label: tCommon("all") },
    { key: "DRAFT",     label: tCommon("draft") },
    { key: "SENT",      label: tCommon("sent") },
    { key: "ACCEPTED",  label: t("status.accepted") },
    { key: "REJECTED",  label: t("status.rejected") },
  ];

  const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
    DRAFT:    { label: tCommon("draft"),      variant: "secondary" },
    SENT:     { label: tCommon("sent"),       variant: "info" },
    ACCEPTED: { label: t("status.accepted"), variant: "success" },
    REJECTED: { label: t("status.rejected"), variant: "destructive" },
    EXPIRED:  { label: t("status.expired"),  variant: "warning" },
  };

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const updateStatus = useUpdateQuoteStatus();
  const convertToInvoice = useConvertQuoteToInvoice();
  const deleteQuote = useDeleteQuote();
  const sendEmail = useSendQuoteEmail();
  const duplicateQuote = useDuplicateQuote();

  const { data, isLoading } = useQuotes({
    search: debouncedSearch || undefined,
    status,
    page,
    limit: 20,
  });

  const quotes: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
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
            placeholder="Buscar presupuestos..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No hay presupuestos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Los presupuestos enviados a clientes aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Número
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Cliente
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                      Fecha
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                      Válido hasta
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">
                      Importe
                    </th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-3">
                      Estado
                    </th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q: any, i: number) => {
                    const config =
                      STATUS_CONFIG[q.status] ??
                      { label: "Borrador", variant: "secondary" as const };
                    return (
                      <motion.tr
                        key={q.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                          {q.number}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{q.client?.name ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          {formatDate(q.issueDate)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {q.validUntil ? (
                            <span
                              className={cn(
                                "text-sm",
                                new Date(q.validUntil) < new Date() &&
                                  !["ACCEPTED", "REJECTED"].includes(q.status)
                                  ? "text-destructive font-medium"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatDate(q.validUntil)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(Number(q.total))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={config.variant as any}>
                            {config.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={pdfLoading === q.id}
                                onClick={async () => {
                                  setPdfLoading(q.id);
                                  try { await downloadQuotePdf(q.id); }
                                  catch { toast.error("Error al generar PDF"); }
                                  finally { setPdfLoading(null); }
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {pdfLoading === q.id ? "Generando..." : "Descargar PDF"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => sendEmail.mutate(q.id)}
                                disabled={sendEmail.isPending}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Enviar por email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => duplicateQuote.mutate(q.id)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {q.status === "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ id: q.id, status: "SENT" })
                                  }
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Marcar como enviado
                                </DropdownMenuItem>
                              )}
                              {q.status === "SENT" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatus.mutate({
                                        id: q.id,
                                        status: "ACCEPTED",
                                      })
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marcar como aceptado
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatus.mutate({
                                        id: q.id,
                                        status: "REJECTED",
                                      })
                                    }
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Marcar como rechazado
                                  </DropdownMenuItem>
                                </>
                              )}
                              {["SENT", "ACCEPTED"].includes(q.status) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      convertToInvoice.mutate(q.id)
                                    }
                                    disabled={convertToInvoice.isPending}
                                  >
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Convertir a factura
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `¿Eliminar el presupuesto ${q.number}?`
                                    )
                                  )
                                    deleteQuote.mutate(q.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
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
          <span>
            Página {page} de {totalPages}
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

      <QuoteDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
