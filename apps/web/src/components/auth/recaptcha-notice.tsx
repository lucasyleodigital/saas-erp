"use client";

import { useTranslations } from "next-intl";

// El sello flotante de reCAPTCHA se oculta en globals.css; Google exige
// mostrar este aviso en los formularios que lo usan.
export function RecaptchaNotice() {
  const t = useTranslations("auth.recaptcha");
  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) return null;
  return (
    <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
      {t("before")}{" "}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
        {t("privacy")}
      </a>{" "}
      {t("and")}{" "}
      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
        {t("terms")}
      </a>{" "}
      {t("after")}
    </p>
  );
}
