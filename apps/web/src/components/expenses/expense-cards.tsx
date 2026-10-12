"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocaleLink } from "@/components/ui/locale-link";
import { CreditCard, Link2Off, Loader2, Pencil, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBankAccounts } from "@/hooks/use-bank";
import {
  useAutoMatchCards,
  useCardReconciliation,
  useCompanyCards,
  useDeleteCompanyCard,
  useRequestChargeReceipt,
  useSaveCompanyCard,
  useUnlinkCharge,
  type ChargeStatus,
  type CompanyCard,
} from "@/hooks/use-expense-claims";
import { useExpenseFormat } from "./use-expense-format";

const NONE = "__none__";
type Range = "month" | "3m" | "ytd";

const STATUS_VARIANT: Record<ChargeStatus, "success" | "warning" | "destructive"> = {
  JUSTIFIED: "success",
  PENDING_RECEIPT: "warning",
  MISSING: "destructive",
};

function rangeParams(range: Range) {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (range === "ytd") return { from: `${now.getFullYear()}-01-01`, to };
  const back = range === "month" ? 0 : 2;
  return { from: new Date(Date.UTC(now.getFullYear(), now.getMonth() - back, 1)).toISOString().slice(0, 10), to };
}

function CardForm({ card, employees, onClose }: {
  card: CompanyCard | null;
  employees: { id: string; name: string }[];
  onClose: () => void;
}) {
  const { t } = useExpenseFormat();
  const save = useSaveCompanyCard();
  const { data: accounts = [] } = useBankAccounts();
  const [name, setName] = useState(card?.name ?? "");
  const [last4, setLast4] = useState(card?.last4 ?? "");
  const [employeeId, setEmployeeId] = useState(card?.employeeId ?? "");
  const [bankAccountId, setBankAccountId] = useState(card?.bankAccountId ?? "");
  const [dedicated, setDedicated] = useState(card?.dedicatedAccount ?? false);
  const [isActive, setIsActive] = useState(card?.isActive ?? true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await save.mutateAsync({
      ...(card && { id: card.id }),
      name, last4,
      employeeId: employeeId || null,
      bankAccountId: bankAccountId || null,
      dedicatedAccount: !!bankAccountId && dedicated,
      isActive,
    });
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-[1fr_130px] gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="card-name">{t("cards.name")}</Label>
          <Input id="card-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("cards.namePlaceholder")} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-last4">{t("cards.last4")}</Label>
          <Input
            id="card-last4"
            inputMode="numeric"
            maxLength={4}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="1234"
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="card-holder">{t("cards.holder")}</Label>
        <Select value={employeeId || NONE} onValueChange={(v) => setEmployeeId(v === NONE ? "" : v)}>
          <SelectTrigger id="card-holder"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("cards.noHolder")}</SelectItem>
            {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="card-account">{t("cards.account")}</Label>
        <Select value={bankAccountId || NONE} onValueChange={(v) => setBankAccountId(v === NONE ? "" : v)}>
          <SelectTrigger id="card-account"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("cards.anyAccount")}</SelectItem>
            {(accounts as { id: string; name: string }[]).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {bankAccountId && (
        <label htmlFor="card-dedicated" className="flex items-start gap-2.5 cursor-pointer">
          <input id="card-dedicated" type="checkbox" checked={dedicated} onChange={(e) => setDedicated(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
          <span className="text-sm">{t("cards.dedicated")}
            <span className="block text-xs text-muted-foreground">{t("cards.dedicatedHint")}</span>
          </span>
        </label>
      )}
      {card && (
        <label htmlFor="card-active" className="flex items-center gap-2.5 cursor-pointer text-sm">
          <input id="card-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-primary" />
          {t("cards.active")}
        </label>
      )}
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose}>{t("cards.cancel")}</Button>
        <Button type="submit" disabled={save.isPending || !name.trim() || last4.length !== 4}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          {t("cards.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ExpenseCards({ employees }: { employees: { id: string; name: string }[] }) {
  const { t, money, date } = useExpenseFormat();
  const { data: cards = [], isLoading: cardsLoading } = useCompanyCards();
  const [range, setRange] = useState<Range>("3m");
  const params = useMemo(() => rangeParams(range), [range]);
  const { data: recon, isLoading } = useCardReconciliation(params);
  const autoMatch = useAutoMatchCards();
  const requestReceipt = useRequestChargeReceipt();
  const unlink = useUnlinkCharge();
  const del = useDeleteCompanyCard();
  const [dialog, setDialog] = useState<CompanyCard | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CompanyCard | null>(null);

  async function runAutoMatch() {
    const res = await autoMatch.mutateAsync(params);
    toast.success(t("cards.autoMatched", { count: res.linked }));
  }

  const k = recon?.totals;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{t("cards.title")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{t("cards.body")}</p>
            </div>
            <Button size="sm" onClick={() => setDialog("new")}><Plus className="h-4 w-4 mr-1.5" /> {t("cards.add")}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {cardsLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("cards.empty")}</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {cards.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {c.name} <span className="font-mono text-muted-foreground">·{c.last4}</span>
                      {!c.isActive && <Badge variant="secondary" className="ml-2 text-[10px]">{t("cards.inactive")}</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : t("cards.noHolder")}
                      {" · "}{c.bankAccount?.name ?? t("cards.anyAccount")}
                      {c.dedicatedAccount ? ` · ${t("cards.dedicated").toLowerCase()}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialog(c)} aria-label={t("cards.edit")}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDelete(c)}
                    aria-label={t("cards.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {cards.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{t("cards.reconTitle")}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("cards.reconBody")}{" "}
                  {t.rich("cards.importHint", {
                    link: (chunks) => <LocaleLink href="/banco" className="text-primary hover:underline">{chunks}</LocaleLink>,
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={range} onValueChange={(v) => setRange(v as Range)}>
                  <SelectTrigger className="w-44" aria-label={t("analytics.period")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">{t("cards.thisMonth")}</SelectItem>
                    <SelectItem value="3m">{t("analytics.last3")}</SelectItem>
                    <SelectItem value="ytd">{t("analytics.ytd")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={runAutoMatch} disabled={autoMatch.isPending}>
                  {autoMatch.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                  {t("cards.autoMatch")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading || !recon || !k ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t("cards.kpiCharges")}</p>
                    <p className="font-semibold tabular-nums">{k.charges} · {money(k.amount)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t("cards.kpiJustified")}</p>
                    <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{k.justified}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t("cards.kpiPending")}</p>
                    <p className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">{k.pendingReceipt}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t("cards.kpiMissing")}</p>
                    <p className="font-semibold tabular-nums text-destructive">{k.missing} · {money(k.missingAmount)}</p>
                  </div>
                </div>

                {recon.charges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("cards.noCharges")}</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">{t("cards.cols.date")}</th>
                          <th className="px-3 py-2 text-left font-medium">{t("cards.cols.charge")}</th>
                          <th className="px-3 py-2 text-left font-medium hidden md:table-cell">{t("cards.cols.card")}</th>
                          <th className="px-3 py-2 text-right font-medium">{t("cards.cols.amount")}</th>
                          <th className="px-3 py-2 text-left font-medium">{t("cards.cols.status")}</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {recon.charges.map((ch) => (
                          <tr key={ch.id} className="border-t align-top">
                            <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{date(ch.date)}</td>
                            <td className="px-3 py-2.5 min-w-[180px]">
                              <div className="truncate max-w-[280px]">{ch.description}</div>
                              {ch.claim && (
                                <div className="text-xs text-muted-foreground">
                                  {t(`categories.${ch.claim.category}`)} · {ch.claim.employee.firstName} {ch.claim.employee.lastName}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 hidden md:table-cell text-xs">
                              {ch.card ? (
                                <>
                                  {ch.card.name} <span className="font-mono">·{ch.card.last4}</span>
                                  <div className="text-muted-foreground">
                                    {ch.card.employee ? `${ch.card.employee.firstName} ${ch.card.employee.lastName}` : t("cards.noHolder")}
                                  </div>
                                </>
                              ) : "—"}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap">{money(ch.amount)}</td>
                            <td className="px-3 py-2.5"><Badge variant={STATUS_VARIANT[ch.status]}>{t(`cards.status.${ch.status}`)}</Badge></td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                              {ch.status === "MISSING" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  disabled={!ch.card?.employee || requestReceipt.isPending}
                                  title={!ch.card?.employee ? t("cards.needsHolder") : undefined}
                                  onClick={() => requestReceipt.mutate(ch.id)}
                                >
                                  <Send className="h-3.5 w-3.5 mr-1.5" /> {t("cards.requestReceipt")}
                                </Button>
                              ) : ch.claim ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-muted-foreground"
                                  disabled={unlink.isPending}
                                  onClick={() => unlink.mutate(ch.claim!.id)}
                                >
                                  <Link2Off className="h-3.5 w-3.5 mr-1.5" /> {t("cards.unlink")}
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {recon.unmatchedClaims.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t("cards.unmatchedTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("cards.unmatchedBody")}</p>
                    <ul className="divide-y rounded-lg border">
                      {recon.unmatchedClaims.map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                          <span className="min-w-0 truncate">
                            {date(c.date)} · {t(`categories.${c.category}`)}
                            {c.merchant ? ` · ${c.merchant}` : ""}
                            {c.employee ? ` · ${c.employee.firstName} ${c.employee.lastName}` : ""}
                            {c.card ? ` · ·${c.card.last4}` : ""}
                          </span>
                          <span className="tabular-nums font-medium shrink-0">{money(c.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-sm font-medium">{t("cards.stripeTitle")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("cards.stripeBody")}</p>
        </CardContent>
      </Card>

      <Dialog open={dialog !== null} onOpenChange={(v) => { if (!v) setDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{dialog === "new" ? t("cards.newTitle") : t("cards.editTitle")}</DialogTitle></DialogHeader>
          {dialog !== null && (
            <CardForm
              key={dialog === "new" ? "new" : dialog.id}
              card={dialog === "new" ? null : dialog}
              employees={employees}
              onClose={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete !== null} onOpenChange={(v) => { if (!v) setConfirmDelete(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("cards.delete")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDelete ? t("cards.deleteConfirm", { name: `${confirmDelete.name} ·${confirmDelete.last4}` }) : ""}
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>{t("cards.cancel")}</Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={async () => { if (confirmDelete) await del.mutateAsync(confirmDelete.id); setConfirmDelete(null); }}
            >
              {t("cards.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
