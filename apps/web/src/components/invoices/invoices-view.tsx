"use client";

import { useState } from "react";
import { useInvoices, useUpdateInvoiceStatus, useSendInvoiceEmail, useDeleteInvoice, useCreatePaymentLink, useSetRecurring, useDuplicateInvoice, useBulkUpdateStatus } from "@/hooks/use-invoices";
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
  CreditCard,
  RefreshCw,
  Copy,
  Bell,
  Filter,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import { useExport } from "@/hooks/use-export";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LocaleLink as Link } from "@/components/ui/locale-link";
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(search, 300);
  const updateStatus = useUpdateInvoiceStatus();
  const sendEmail = useSendInvoiceEmail();
  const deleteInvoice = useDeleteInvoice();
  const paymentLink = useCreatePaymentLink();
  const setRecurring = useSetRecurring();
  const duplicateInvoice = useDuplicateInvoice();
  const bulkUpdate = useBulkUpdateStatus();
  const { exportData: exportInvoices, isPending: exporting } = useExport("invoices");

  const { data, isLoading, isError, error } = useInvoices({
    search: debouncedSearch || undefined,
    status,
    page,
    limit: 20,
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(amountMin ? { amountMin } : {}),
    ...(amountMax ? { amountMax } : {}),
    ...(clientFilter ? { client: clientFilter } : {}),
  });

  const invoices = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={exportInvoices} disabled={exporting} className="gap-2">
            <Download className="h-4 w-4" />
            {exporting ? tCommon("exporting") : tCommon("export")}
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("new")}
          </Button>
        </div>
      </div>

      {/* Tabs + Search + Filters */}
      <div className="space-y-3">
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
              placeholder={t("searchPlaceholder")}
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {tCommon("filters")}
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="filter-date-from">{tCommon("from")}</Label>
                  <Input
                    id="filter-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filter-date-to">{tCommon("to")}</Label>
                  <Input
                    id="filter-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filter-amount-min">{t("filterAmountMin")}</Label>
                  <Input
                    id="filter-amount-min"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={amountMin}
                    onChange={(e) => { setAmountMin(e.target.value); setPage(1); }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filter-amount-max">{t("filterAmountMax")}</Label>
                  <Input
                    id="filter-amount-max"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={amountMax}
                    onChange={(e) => { setAmountMax(e.target.value); setPage(1); }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filter-client">{t("filterClient")}</Label>
                  <Input
                    id="filter-client"
                    type="text"
                    placeholder={t("filterClientPlaceholder")}
                    value={clientFilter}
                    onChange={(e) => { setClientFilter(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setAmountMin("");
                    setAmountMax("");
                    setClientFilter("");
                    setPage(1);
                  }}
                >
                  {tCommon("clearFilters")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
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
              <p className="font-medium text-destructive">{t("errorLoading")}</p>
              <p className="text-sm text-muted-foreground mt-1 mb-2 max-w-md">
                {(error as any)?.response?.status === 401
                  ? t("sessionExpired")
                  : (error as any)?.message ?? t("serverError")}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {(error as any)?.response?.status && `HTTP ${(error as any).response.status}`}
                {(error as any)?.config?.baseURL && ` — ${(error as any).config.baseURL}`}
              </p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">{t("emptyTitle")}</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {t("emptyDescription")}
              </p>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("emptyAction")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selected.size === invoices.length && invoices.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelected(new Set(invoices.map((i: any) => i.id)));
                          else setSelected(new Set());
                        }}
                      />
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("number")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("client")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">{t("date")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">{t("dueDate")}</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">{t("amount")}</th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-3">{t("status")}</th>
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
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-border"
                            checked={selected.has(inv.id)}
                            onChange={(e) => {
                              const next = new Set(selected);
                              if (e.target.checked) next.add(inv.id);
                              else next.delete(inv.id);
                              setSelected(next);
                            }}
                          />
                        </td>
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
                              {t("paidAmount", { amount: formatCurrency(Number(inv.paidAmount)) })}
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
                                  {t("viewInvoice")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={pdfLoading === inv.id}
                                onClick={async () => {
                                  setPdfLoading(inv.id);
                                  try { await downloadInvoicePdf(inv.id); }
                                  catch { toast.error(t("pdfError")); }
                                  finally { setPdfLoading(null); }
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {pdfLoading === inv.id ? t("generatingPdf") : t("downloadPdf")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => duplicateInvoice.mutate(inv.id)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                {t("duplicate")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => sendEmail.mutate(inv.id)}
                                disabled={sendEmail.isPending}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                {t("sendByEmail")}
                              </DropdownMenuItem>
                              {inv.status !== "PAID" && inv.status !== "CANCELLED" && inv.status !== "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() => paymentLink.mutate(inv.id)}
                                  disabled={paymentLink.isPending}
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  {paymentLink.isPending ? tCommon("generating") : t("stripePaymentLink")}
                                </DropdownMenuItem>
                              )}
                              {inv.isRecurring ? (
                                <DropdownMenuItem
                                  onClick={() => setRecurring.mutate({ id: inv.id, isRecurring: false })}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  {t("disableRecurrence")}
                                </DropdownMenuItem>
                              ) : inv.status === "PAID" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    const interval = prompt(t("recurrencePrompt"), "MONTHLY");
                                    if (interval) setRecurring.mutate({ id: inv.id, isRecurring: true, interval: interval.toUpperCase() });
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  {t("makeRecurrent")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {inv.status === "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ id: inv.id, status: "SENT" })
                                  }
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  {t("markAsSent")}
                                </DropdownMenuItem>
                              )}
                              {["SENT", "PARTIAL", "OVERDUE"].includes(inv.status) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ id: inv.id, status: "PAID" })
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {t("markAsPaidAction")}
                                </DropdownMenuItem>
                              )}
                              {["SENT", "OVERDUE", "PARTIAL"].includes(inv.status) && (
                                <DropdownMenuItem
                                  onClick={() => sendEmail.mutate(inv.id)}
                                  disabled={sendEmail.isPending}
                                >
                                  <Bell className="h-4 w-4 mr-2" />
                                  {t("sendPaymentReminder")}
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
                                  {t("cancelInvoice")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (confirm(t("confirmDelete", { number: inv.number }))) {
                                    deleteInvoice.mutate(inv.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("deleteAction")}
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
          <span>{t("pageOf", { page, totalPages })}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {tCommon("previous")}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              {tCommon("next")}
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border shadow-lg rounded-xl px-5 py-3">
          <span className="text-sm font-medium">{t("selectedCount", { count: selected.size })}</span>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkUpdate.isPending}
            onClick={() => {
              bulkUpdate.mutate(
                { ids: Array.from(selected), status: "PAID" },
                { onSettled: () => setSelected(new Set()) }
              );
            }}
          >
            <CheckCircle className="h-4 w-4 mr-1" /> {t("bulkPaid")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkUpdate.isPending}
            onClick={() => {
              bulkUpdate.mutate(
                { ids: Array.from(selected), status: "SENT" },
                { onSettled: () => setSelected(new Set()) }
              );
            }}
          >
            <Send className="h-4 w-4 mr-1" /> {t("bulkSent")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            disabled={bulkUpdate.isPending}
            onClick={() => {
              bulkUpdate.mutate(
                { ids: Array.from(selected), status: "CANCELLED" },
                { onSettled: () => setSelected(new Set()) }
              );
            }}
          >
            <XCircle className="h-4 w-4 mr-1" /> {t("bulkCancel")}
          </Button>
        </div>
      )}

      <InvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
