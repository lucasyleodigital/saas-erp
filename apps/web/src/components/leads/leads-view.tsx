"use client";

import { useState } from "react";
import {
  useLeads,
  useCreateLead,
  useConvertLead,
  useDeleteLead,
} from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Plus,
  MoreHorizontal,
  UserCheck,
  Trash2,
  Loader2,
  Users,
  Filter,
  X,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";

const SOURCE_KEYS = [
  "web",
  "referral",
  "linkedin",
  "googleAds",
  "call",
  "email",
  "event",
  "other",
] as const;

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function LeadsView() {
  const t = useTranslations("leads");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const hasActiveFilters = !!(sourceFilter || dateFrom || dateTo);
  function clearFilters() { setSourceFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }

  const { data, isLoading } = useLeads({
    search: debouncedSearch || undefined,
    page,
    limit: 20,
    ...(sourceFilter ? { source: sourceFilter } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  });
  const createLead = useCreateLead();
  const convertLead = useConvertLead();
  const deleteLead = useDeleteLead();
  const leads: any[] = data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined)
    );
    await createLead.mutateAsync(clean);
    setDialogOpen(false);
    reset();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("search")} className="pl-9" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Button variant={showFilters || hasActiveFilters ? "secondary" : "outline"} size="sm"
            onClick={() => setShowFilters((v) => !v)} className="gap-2 shrink-0">
            <Filter className="h-4 w-4" />{tCommon("filters")}
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />{tCommon("clearFilters")}
            </Button>
          )}
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground">{t("source")}</label>
              <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">{tCommon("all")}</option>
                {SOURCE_KEYS.map((k) => (
                  <option key={k} value={k.toUpperCase()}>{t(`sources.${k}`)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{tCommon("dateFrom")}</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{tCommon("dateTo")}</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-muted/40 animate-pulse border-b border-border last:border-0"
              />
            ))
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t("noResults")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("noResultsDesc")}
                </p>
              </div>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("new")}
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">
                    {tCommon("name")}
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                    {t("company")}
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                    {t("source")}
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                    {tCommon("date")}
                  </th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{lead.name}</p>
                      {lead.email && (
                        <p className="text-xs text-muted-foreground">
                          {lead.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {lead.company ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {lead.source ? (
                        <Badge variant="secondary">{lead.source}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                      {formatDate(lead.createdAt)}
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
                            onClick={() => convertLead.mutate(lead.id)}
                            disabled={convertLead.isPending}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            {t("convert")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  t("confirmDelete", { name: lead.name })
                                )
                              )
                                deleteLead.mutate(lead.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {tCommon("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("new")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="lead-name">{tCommon("name")} *</Label>
                <Input
                  id="lead-name"
                  {...register("name")}
                  placeholder={t("form.namePlaceholder")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-email">{tCommon("email")}</Label>
                <Input
                  id="lead-email"
                  type="email"
                  {...register("email")}
                  placeholder={t("form.emailPlaceholder")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-phone">{tCommon("phone")}</Label>
                <Input
                  id="lead-phone"
                  {...register("phone")}
                  placeholder={t("form.phonePlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-company">{t("company")}</Label>
                <Input
                  id="lead-company"
                  {...register("company")}
                  placeholder={t("form.companyPlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-source">{t("source")}</Label>
                <select
                  id="lead-source"
                  {...register("source")}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t("form.selectSource")}</option>
                  {SOURCE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t(`sources.${key}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="lead-notes">{tCommon("notes")}</Label>
                <textarea
                  id="lead-notes"
                  {...register("notes")}
                  rows={2}
                  placeholder={t("form.notesPlaceholder")}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  reset();
                }}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {t("form.createLead")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
