"use client";

import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LOCALE_LABELS: Record<string, string> = {
  es: "Castellano",
  ca: "Catala",
  eu: "Euskara",
  gl: "Galego",
  en: "English",
};

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from URL path
  const segments = pathname.split("/");
  const locale = routing.locales.includes(segments[1] as (typeof routing.locales)[number])
    ? segments[1]!
    : routing.defaultLocale;

  const handleLocaleChange = (newLocale: string) => {
    // Replace the current locale in the path with the new one
    const segments = pathname.split("/");
    segments[1] = newLocale; // segments[0] is "", segments[1] is the locale
    const newPath = segments.join("/");
    router.push(newPath);
    router.refresh();
  };

  const currentLabel = LOCALE_LABELS[locale] ?? "Castellano";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={locale === loc ? "bg-accent" : ""}
          >
            {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
