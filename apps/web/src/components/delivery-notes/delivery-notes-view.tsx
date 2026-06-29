"use client";

import { useState } from "react";
import {
  useDeliveryNotes,
  useUpdateDeliveryNoteStatus,
  useConvertDeliveryNoteToInvoice,
  useDeleteDeliveryNote,
  getDNStatusConfig,
} from "@/hooks/use-delivery-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Truck,
  Send,
  CheckCircle,
  XCircle,
  ArrowRight,
  Trash2,
  Eye,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { motion } from "framer-motion";
import { DeliveryNoteDialog } from "./delivery-note-dialog";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { useTranslations } from "next-intl";

const STATUS_TAB_KEYS = [
  { key: undefined,   tKey: "all" },
  { key: "DRAFT",     tKey: "draft" },
  { key: "SENT",      tKey: "sent" },
  { key: "DELIVERED", tKey: "delivered" },
  { key: "INVOICED",  tKey: "invoiced" },
  { key: "CANCELLED", tKey: "cancelled" },
];

export function DeliveryNotesView() {
  const t = useTranslations("deliveryNotes");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const updateStatus = useUpdateDeliveryNoteStatus();
  const convertToInvoice = useConvertDeliveryNoteToInvoice();
  const deleteNote = useDeleteDeliveryNote();

  const { data, isLoading } = useDeliveryNotes({
    search: debouncedSearch || undefined,
    status,
    page,
    limit: 20,
  });

  const notes: any[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto">
          {STATUS_TAB_KEYS.map((tab) => (
            <button
              key={tab.tKey}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
                status === tab.key
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`statuses.${tab.tKey}`)}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
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
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Truck className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">{t("noResults")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("noResultsDesc")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("table.number")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("table.client")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">{t("table.issueDate")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">{t("table.deliveryDate")}</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">{t("table.amount")}</th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-3">{t("table.status")}</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {notes.map((n: any, i: number) => {
                    const cfg = getDNStatusConfig(n.status);
                    return (
                      <motion.tr
                        key={n.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                          {n.number}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {n.client?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          {formatDate(n.issueDate)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {n.deliveryDate ? formatDate(n.deliveryDate) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(Number(n.total))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.color)}>
                            {t(`statuses.${n.status.toLowerCase()}`)}
                          </span>
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
                                <Link href={`/albaranes/${n.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t("table.viewDetail")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {n.status === "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() => updateStatus.mutate({ id: n.id, status: "SENT" })}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  {t("table.markSent")}
                                </DropdownMenuItem>
                              )}
                              {n.status === "SENT" && (
                                <DropdownMenuItem
                                  onClick={() => updateStatus.mutate({ id: n.id, status: "DELIVERED" })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {t("table.markDelivered")}
                                </DropdownMenuItem>
                              )}
                              {["SENT", "DELIVERED"].includes(n.status) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => convertToInvoice.mutate(n.id)}
                                    disabled={convertToInvoice.isPending}
                                  >
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    {t("table.convertToInvoice")}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {!["INVOICED", "CANCELLED"].includes(n.status) && (
                                <DropdownMenuItem
                                  onClick={() => updateStatus.mutate({ id: n.id, status: "CANCELLED" })}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {t("table.cancel")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (confirm(t("table.confirmDelete", { number: n.number })))
                                    deleteNote.mutate(n.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("table.delete")}
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
          <span>{t("table.page", { page, totalPages })}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t("pagination.previous")}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              {t("pagination.next")}
            </Button>
          </div>
        </div>
      )}

      <DeliveryNoteDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
