"use client";

import { useState, useRef } from "react";
import {
  useBankAccounts,
  useCreateBankAccount,
  useImportBankStatement,
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
            Nueva cuenta bancaria
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre de la cuenta *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Cuenta principal"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>IBAN *</Label>
            <Input
              value={form.iban}
              onChange={(e) => handleChange("iban", e.target.value)}
              placeholder="ES00 0000 0000 0000 0000 0000"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>BIC / SWIFT</Label>
              <Input
                value={form.bic}
                onChange={(e) => handleChange("bic", e.target.value)}
                placeholder="ABCDESXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Banco</Label>
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
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Crear cuenta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Account Card ────────────────────────────────────────────────────────────

function AccountCard({ account }: { account: any }) {
  const importStatement = useImportBankStatement();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="flex items-center justify-between">
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
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">
            {account.iban}
          </p>
          <div>
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
              Importar CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function BankView() {
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
            Cuentas bancarias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tus cuentas e importa extractos bancarios
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva cuenta
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
          <p className="font-semibold text-lg">Sin cuentas bancarias</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Crea tu primera cuenta bancaria para empezar a importar
            movimientos y llevar el control de tus finanzas.
          </p>
          <Button
            className="mt-6 gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> Crear cuenta
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
