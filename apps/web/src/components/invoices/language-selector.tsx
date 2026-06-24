"use client";

import { Label } from "@/components/ui/label";
import { Languages } from "lucide-react";

const DOCUMENT_LANGUAGES = [
  { code: "es", label: "Castellano" },
  { code: "ca", label: "Catala" },
  { code: "eu", label: "Euskara" },
  { code: "gl", label: "Galego" },
  { code: "en", label: "English" },
] as const;

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm">
        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
        Idioma del documento
      </Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {DOCUMENT_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
