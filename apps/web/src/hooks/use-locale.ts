"use client";

import { usePathname } from "next/navigation";

const LOCALES = ["es", "en", "fr", "de", "pt", "it"];

export function useLocale(): string {
  const pathname = usePathname();
  const first = pathname.split("/")[1] ?? "";
  return LOCALES.includes(first) ? first : "es";
}
