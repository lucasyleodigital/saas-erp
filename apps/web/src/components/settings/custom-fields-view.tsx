"use client";

import { useState } from "react";
import { useCustomFields, useCreateCustomField, useUpdateCustomField, useDeleteCustomField } from "@/hooks/use-custom-fields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Settings2, Plus, Trash2, GripVertical, Type, Pencil, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const ENTITY_TAB_VALUES = [
  { value: "CLIENT", key: "clients" },
  { value: "INVOICE", key: "invoices" },
  { value: "PRODUCT", key: "products" },
  { value: "PROJECT", key: "projects" },
] as const;

const FIELD_TYPE_VALUES = [
  { value: "TEXT", key: "text" },
  { value: "NUMBER", key: "number" },
  { value: "DATE", key: "date" },
  { value: "SELECT", key: "select" },
  { value: "BOOLEAN", key: "boolean" },
] as const;

const TYPE_LABEL_KEYS: Record<string, string> = {
  TEXT: "text",
  NUMBER: "number",
  DATE: "date",
  SELECT: "select",
  BOOLEAN: "boolean",
};

interface FieldFormData {
  name: string;
  type: string;
  options: string;
  required: boolean;
  order: number;
}

const EMPTY_FORM: FieldFormData = {
  name: "",
  type: "TEXT",
  options: "",
  required: false,
  order: 0,
};

export function CustomFieldsView() {
  const t = useTranslations("customFields");
  const tCommon = useTranslations("common");
  const [selectedEntity, setSelectedEntity] = useState<string>("CLIENT");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FieldFormData>(EMPTY_FORM);

  const { data: fields, isLoading } = useCustomFields(selectedEntity);
  const createField = useCreateCustomField();
  const updateField = useUpdateCustomField();
  const deleteField = useDeleteCustomField();

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order: (fields?.length ?? 0) + 1 });
    setDialogOpen(true);
  }

  function openEdit(field: any) {
    setEditingId(field.id);
    setForm({
      name: field.name ?? "",
      type: field.type ?? "TEXT",
      options: Array.isArray(field.options) ? field.options.join(", ") : "",
      required: field.required ?? false,
      order: field.order ?? 0,
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    const payload: Record<string, unknown> = {
      name: form.name,
      type: form.type,
      required: form.required,
      order: form.order,
      entity: selectedEntity,
    };

    if (form.type === "SELECT" && form.options.trim()) {
      payload.options = form.options.split(",").map((o) => o.trim()).filter(Boolean);
    }

    if (editingId) {
      updateField.mutate({ id: editingId, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createField.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  }

  function handleDelete(id: string) {
    if (confirm(t("confirmDelete"))) {
      deleteField.mutate(id);
    }
  }

  const isPending = createField.isPending || updateField.isPending;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-muted-foreground" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("newField")}
        </Button>
      </div>

      <Tabs value={selectedEntity} onValueChange={setSelectedEntity}>
        <TabsList>
          {ENTITY_TAB_VALUES.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {t(`entities.${tab.key}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {ENTITY_TAB_VALUES.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  {t("fieldsOf", { entity: t(`entities.${tab.key}`).toLowerCase() })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : !fields || fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Type className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t("noFields", { entity: t(`entities.${tab.key}`).toLowerCase() })}</p>
                    <Button onClick={openCreate} variant="outline" size="sm" className="mt-3 gap-2">
                      <Plus className="h-4 w-4" />
                      {t("createFirst")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Table header */}
                    <div className="grid grid-cols-[auto_1fr_120px_100px_80px_80px] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                      <div className="w-6" />
                      <div>{tCommon("name")}</div>
                      <div>{t("table.type")}</div>
                      <div>{t("table.required")}</div>
                      <div>{t("table.order")}</div>
                      <div>{tCommon("actions")}</div>
                    </div>

                    {/* Table rows */}
                    {(fields as any[]).map((field) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-[auto_1fr_120px_100px_80px_80px] gap-3 px-3 py-3 items-center border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <div className="w-6">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                        <div className="text-sm font-medium">{field.name}</div>
                        <div>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {t(`fieldTypes.${TYPE_LABEL_KEYS[field.type] ?? field.type}`)}
                          </Badge>
                        </div>
                        <div>
                          {field.required ? (
                            <Badge variant="default" className="text-xs">{tCommon("yes")}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">{tCommon("no")}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{field.order}</div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(field)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(field.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t("dialog.editTitle") : t("dialog.createTitle")}</DialogTitle>
            <DialogDescription>
              {editingId
                ? t("dialog.editDescription")
                : t("dialog.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cf-name">{t("dialog.fieldName")}</Label>
              <Input
                id="cf-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Numero de referencia"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cf-type">{t("dialog.fieldType")}</Label>
              <select
                id="cf-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {FIELD_TYPE_VALUES.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {t(`fieldTypes.${ft.key}`)}
                  </option>
                ))}
              </select>
            </div>

            {form.type === "SELECT" && (
              <div className="space-y-1.5">
                <Label htmlFor="cf-options">{t("dialog.options")}</Label>
                <Input
                  id="cf-options"
                  value={form.options}
                  onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                  placeholder="Opcion 1, Opcion 2, Opcion 3"
                />
                <p className="text-xs text-muted-foreground">
                  Escribe las opciones separadas por comas
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cf-order">{t("table.order")}</Label>
                <Input
                  id="cf-order"
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.required}
                    onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t("dialog.requiredField")}</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim() || isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? t("dialog.saveChanges") : t("dialog.createField")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
