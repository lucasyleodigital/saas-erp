"use client";

import { useCustomFields } from "@/hooks/use-custom-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal } from "lucide-react";

type Entity = "CLIENT" | "INVOICE" | "PRODUCT" | "PROJECT";

interface Props {
  entity: Entity;
  /** Valores actuales: { [customFieldId]: string } */
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function CustomFieldsSection({ entity, values, onChange }: Props) {
  const { data: fields } = useCustomFields(entity);

  const activeFields = (fields ?? []).filter((f: any) => f.isActive);
  if (activeFields.length === 0) return null;

  function handleChange(fieldId: string, value: string) {
    onChange({ ...values, [fieldId]: value });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
          <SlidersHorizontal className="h-3 w-3" />
          Campos personalizados
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {activeFields.map((field: any) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={`cf-${field.id}`} className="text-sm">
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {field.type === "TEXT" && (
              <Input
                id={`cf-${field.id}`}
                value={values[field.id] ?? ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.name}
              />
            )}

            {field.type === "NUMBER" && (
              <Input
                id={`cf-${field.id}`}
                type="number"
                value={values[field.id] ?? ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder="0"
              />
            )}

            {field.type === "DATE" && (
              <Input
                id={`cf-${field.id}`}
                type="date"
                value={values[field.id] ?? ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
              />
            )}

            {field.type === "BOOLEAN" && (
              <div className="flex items-center gap-2 h-10">
                <input
                  id={`cf-${field.id}`}
                  type="checkbox"
                  checked={values[field.id] === "true"}
                  onChange={(e) => handleChange(field.id, String(e.target.checked))}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <label htmlFor={`cf-${field.id}`} className="text-sm text-muted-foreground">
                  {values[field.id] === "true" ? "Sí" : "No"}
                </label>
              </div>
            )}

            {field.type === "SELECT" && (
              <select
                id={`cf-${field.id}`}
                value={values[field.id] ?? ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleccionar...</option>
                {(Array.isArray(field.options) ? field.options : []).map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
