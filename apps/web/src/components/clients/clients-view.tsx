"use client";

import { useState } from "react";
import { useClients, useDeleteClient, useGeneratePortalToken } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClientDialog } from "./client-dialog";
import { formatCurrency, getInitials } from "@/lib/utils";
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Edit,
  Trash2,
  Eye,
  Globe,
  AlertCircle,
  Download,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { useTranslations } from "next-intl";
import { useExport } from "@/hooks/use-export";

export function ClientsView() {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const hasActiveFilters = !!typeFilter;

  const { data, isLoading, isError, error } = useClients({
    search: debouncedSearch || undefined,
    page,
    limit: 20,
    ...(typeFilter ? { type: typeFilter } : {}),
  });

  const deleteClient = useDeleteClient();
  const generatePortalToken = useGeneratePortalToken();
  const { exportData: exportClients, isPending: exporting } = useExport("clients");

  async function handlePortalLink(clientId: string) {
    try {
      const result = await generatePortalToken.mutateAsync(clientId);
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${result.portalToken}`;
      await navigator.clipboard.writeText(url);
      toast.success(t("portalLinkCopied"));
    } catch {
      toast.error(t("portalLinkError"));
    }
  }

  const clients = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function handleEdit(client: any) {
    setEditingClient(client);
    setDialogOpen(true);
  }

  function handleNew() {
    setEditingClient(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportClients} disabled={exporting} className="gap-2">
            <Download className="h-4 w-4" />
            {exporting ? tCommon("exporting") : tCommon("export")}
          </Button>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("new")}
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Button
            variant={showFilters || hasActiveFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-2 shrink-0"
          >
            <Filter className="h-4 w-4" />
            {tCommon("filters")}
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setTypeFilter(""); setPage(1); }}>
              <X className="h-4 w-4 mr-1" />{tCommon("clearFilters")}
            </Button>
          )}
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground">{t("type")}</label>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{tCommon("all")}</option>
                <option value="INDIVIDUAL">{t("typeIndividual")}</option>
                <option value="COMPANY">{t("typeCompany")}</option>
              </select>
            </div>
          </div>
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
          ) : clients.length === 0 ? (
            <EmptyState t={t} onNew={handleNew} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      {t("name")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                      {t("contact")}
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                      {t("cifNif")}
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden xl:table-cell">
                      {t("billed")}
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden xl:table-cell">
                      {t("pending")}
                    </th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {clients.map((client: any, i: number) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                              {getInitials(client.name)}
                            </div>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              {client.city && (
                                <p className="text-xs text-muted-foreground">
                                  {client.city}
                                  {client.province ? `, ${client.province}` : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="space-y-0.5">
                            {client.email && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                          {client.cifNif ?? "—"}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell text-right font-medium">
                          {formatCurrency(Number(client.totalBilled))}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell text-right">
                          {Number(client.pendingBalance) > 0 ? (
                            <Badge variant="warning">
                              {formatCurrency(Number(client.pendingBalance))}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
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
                                <Link href={`/clientes/${client.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t("viewDetail")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(client)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t("editAction")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePortalLink(client.id)}>
                                <Globe className="h-4 w-4 mr-2" />
                                {t("copyPortalLink")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (confirm(t("confirmDelete", { name: client.name }))) {
                                    deleteClient.mutate(client.id);
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
                    ))}
                  </AnimatePresence>
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

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
      />
    </div>
  );
}

function EmptyState({ t, onNew }: { t: any; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium">{t("emptyTitle")}</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {t("emptyDescription")}
      </p>
      <Button onClick={onNew} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        {t("emptyAction")}
      </Button>
    </div>
  );
}
