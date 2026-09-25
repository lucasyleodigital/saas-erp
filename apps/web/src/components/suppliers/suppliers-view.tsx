"use client";

import { useState } from "react";
import {
  useSuppliers,
  useDeleteSupplier,
  useCreateSupplier,
  useUpdateSupplier,
  type Supplier,
} from "@/hooks/use-suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { useTranslations } from "next-intl";
import { SupplierDialog } from "./supplier-dialog";

export function SuppliersView() {
  const t = useTranslations("suppliers");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useSuppliers({ search: debouncedSearch || undefined, page, limit: 20 });
  const deleteSupplier = useDeleteSupplier();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const suppliers = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  function handleNew() { setEditing(null); setDialogOpen(true); }
  function handleEdit(s: Supplier) { setEditing(s); setDialogOpen(true); }

  async function handleSave(dto: Partial<Supplier>) {
    try {
      if (editing) {
        await updateSupplier.mutateAsync({ id: editing.id, ...dto });
        toast.success(t("updateSuccess"));
      } else {
        await createSupplier.mutateAsync(dto);
        toast.success(t("createSuccess"));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t("saveError"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("search")}
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : suppliers.length === 0 ? (
            <EmptyState onNew={handleNew} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("supplier")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">{t("contact")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">{t("cifNif")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">{tCommon("city")}</th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-3 hidden xl:table-cell">{t("purchaseOrdersShort")}</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {suppliers.map((s, i) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-semibold shrink-0">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{s.name}</p>
                              {!s.isActive && (
                                <Badge variant="secondary" className="text-xs">{tCommon("inactive")}</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="space-y-0.5">
                            {s.email && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />{s.email}
                              </div>
                            )}
                            {s.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />{s.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{s.cifNif ?? "—"}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{s.city ?? "—"}</td>
                        <td className="px-4 py-3 hidden xl:table-cell text-center text-muted-foreground">
                          {s._count?.purchaseOrders ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(s)}>
                                <Edit className="h-4 w-4 mr-2" />{tCommon("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (confirm(t("confirmDelete", { name: s.name }))) {
                                    deleteSupplier.mutate(s.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />{tCommon("delete")}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("pageOf", { page, totalPages })}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{tCommon("previous")}</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{tCommon("next")}</Button>
          </div>
        </div>
      )}

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editing}
        onSave={handleSave}
        loading={createSupplier.isPending || updateSupplier.isPending}
      />
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  const t = useTranslations("suppliers");
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Truck className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium">{t("noResults")}</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{t("noResultsDesc")}</p>
      <Button onClick={onNew} size="sm">
        <Plus className="h-4 w-4 mr-2" />{t("new")}
      </Button>
    </div>
  );
}
