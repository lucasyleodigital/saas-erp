"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/use-locale";
import { type ComponentProps } from "react";

type LocaleLinkProps = ComponentProps<typeof Link>;

export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const locale = useLocale();
  const hrefStr = typeof href === "string" ? href : href.pathname ?? "";

  const needsLocale =
    hrefStr.startsWith("/") &&
    !hrefStr.startsWith(`/${locale}/`) &&
    !hrefStr.startsWith("/_next");

  const localizedHref = needsLocale ? `/${locale}${hrefStr}` : hrefStr;

  return <Link href={localizedHref} {...props} />;
}
