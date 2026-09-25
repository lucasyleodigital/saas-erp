"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Supplier } from "@/hooks/use-suppliers";

export function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSave,
  loading,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier: Supplier | null;
  onSave: (dto: Partial<Supplier>) => void;
  loading: boolean;
  /** Prefills the form for a brand-new supplier (e.g. from an AI-scanned
   * receipt) — ignored when `supplier` is set, since that's an edit. */
  initialValues?: Partial<Supplier>;
}) {
  const t = useTranslations("suppliers");
  const tCommon = useTranslations("common");
  const [form, setForm] = useState<Partial<Supplier>>({});

  useEffect(() => {
    if (open) setForm(supplier ? {} : (initialValues ?? {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set(k: keyof Supplier, v: any) { setForm((f) => ({ ...f, [k]: v })); }

  const values = supplier ? { ...supplier, ...form } : form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{supplier ? t("form.dialogTitleEdit") : t("form.dialogTitleNew")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="col-span-2 space-y-1">
            <Label>{t("form.name")}</Label>
            <Input value={values.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{tCommon("email")}</Label>
            <Input value={values.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{tCommon("phone")}</Label>
            <Input value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("cifNif")}</Label>
            <Input value={values.cifNif ?? ""} onChange={(e) => set("cifNif", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("form.contactName")}</Label>
            <Input value={values.contactName ?? ""} onChange={(e) => set("contactName", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{tCommon("address")}</Label>
            <Input value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{tCommon("city")}</Label>
            <Input value={values.city ?? ""} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("form.website")}</Label>
            <Input value={values.website ?? ""} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("form.bankAccount")}</Label>
            <Input value={values.bankAccount ?? ""} onChange={(e) => set("bankAccount", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>{tCommon("notes")}</Label>
            <Input value={values.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
          <Button
            disabled={loading || !values.name}
            onClick={() => onSave(values)}
          >
            {loading ? t("form.saving") : tCommon("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
