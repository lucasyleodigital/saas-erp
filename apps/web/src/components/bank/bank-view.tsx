"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  useBankAccounts,
  useCreateBankAccount,
  useImportBankStatement,
  useBankTransactions,
  useDeleteTransaction,
  useClearTransactions,
} from "@/hooks/use-bank";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Building2,
  Upload,
  Plus,
  CreditCard,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Create Account Dialog ───────────────────────────────────────────────────

function CreateAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const t = useTranslations("bank");
  const tCommon = useTranslations("common");
  const create = useCreateBankAccount();
  const [form, setForm] = useState({
    name: "",
    iban: "",
    bic: "",
    bankName: "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync(form);
    onOpenChange(false);
    setForm({ name: "", iban: "", bic: "", bankName: "" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t("newAccount")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("accountNameRequired")}</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Cuenta principal"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("ibanRequired")}</Label>
            <Input
              value={form.iban}
              onChange={(e) => handleChange("iban", e.target.value)}
              placeholder="ES00 0000 0000 0000 0000 0000"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("bicSwift")}</Label>
              <Input
                value={form.bic}
                onChange={(e) => handleChange("bic", e.target.value)}
                placeholder="ABCDESXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("bankName")}</Label>
              <Input
                value={form.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
                placeholder="CaixaBank"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {t("createAccount")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Account Card ────────────────────────────────────────────────────────────

function AccountCard({ account }: { account: any }) {
  const t = useTranslations("bank");
  const tCommon = useTranslations("common");
  const importStatement = useImportBankStatement();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const deleteTx = useDeleteTransaction();
  const clearTx = useClearTransactions();
  const { data: txData, isLoading: txLoading } = useBankTransactions(
    expanded ? account.id : ""
  );

  const transactions: any[] = txData?.data ?? [];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      importStatement.mutate({ accountId: account.id, file });
      e.target.value = "";
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                {account.name}
              </CardTitle>
              {account.bankName && (
                <p className="text-xs text-muted-foreground">
                  {account.bankName}
                </p>
              )}
            </div>
          </div>
          <p className="text-lg font-bold">
            {formatCurrency(account.balance ?? 0)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">
            {account.iban}
          </p>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.ofx,.qif"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={importStatement.isPending}
            >
              {importStatement.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {t("importStatement")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="h-3.5 w-3.5" /> {t("hide")}</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5" /> {t("transactions")}</>
              )}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="border rounded-lg overflow-hidden">
            {txLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {t("noTransactions")}
              </div>
            ) : (
              <>
              <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b">
                <p className="text-xs text-muted-foreground">{t("transactionCount", { count: transactions.length })}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive gap-1 h-7"
                  onClick={() => {
                    if (confirm(t("confirmClearAll"))) {
                      clearTx.mutate(account.id);
                    }
                  }}
                  disabled={clearTx.isPending}
                >
                  <Trash2 className="h-3 w-3" /> {t("clearAll")}
                </Button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{tCommon("date")}</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("concept")}</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{tCommon("amount")}</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">{tCommon("status")}</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => {
                    const amount = Number(tx.amount);
                    const isIncome = amount > 0;
                    return (
                      <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">
                          {new Date(tx.date).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {isIncome ? (
                              <ArrowDownLeft className="h-3.5 w-3.5 text-green-600 shrink-0" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            )}
                            <span className="truncate max-w-xs">{tx.description}</span>
                          </div>
                          {tx.reference && (
                            <p className="text-xs text-muted-foreground mt-0.5 pl-5">{tx.reference}</p>
                          )}
                        </td>
                        <td className={cn(
                          "px-4 py-2.5 text-right font-semibold tabular-nums",
                          isIncome ? "text-green-600" : "text-red-500"
                        )}>
                          {isIncome ? "+" : ""}{formatCurrency(amount)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {tx.isReconciled ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                              <CheckCircle className="h-3 w-3" /> {t("reconciled")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                              <Clock className="h-3 w-3" /> {tCommon("pending")}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteTx.mutate({ accountId: account.id, txId: tx.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function BankView() {
  const t = useTranslations("bank");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: accounts, isLoading } = useBankAccounts();

  const list: any[] = accounts ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("newAccountShort")}
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <p className="font-semibold text-lg">{t("empty")}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {t("emptyDescription")}
          </p>
          <Button
            className="mt-6 gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> {t("createAccount")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((account, i) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <AccountCard account={account} />
            </motion.div>
          ))}
        </div>
      )}

      <CreateAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
