"use client";

import { usePathname } from "next/navigation";

const LOCALES = ["es", "ca", "eu", "gl", "en"];

export function useLocale(): string {
  const pathname = usePathname();
  const first = pathname.split("/")[1] ?? "";
  return LOCALES.includes(first) ? first : "es";
}
