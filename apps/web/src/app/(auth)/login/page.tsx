import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

// LoginForm uses useTranslations() → needs NextIntlClientProvider at runtime
// The [locale] wrapper provides it; the non-locale route must not be statically rendered
export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
  alternates: { canonical: `${APP_URL}/es/login` },
};

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto">
            E
          </div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground">
          {t("noAccount")}{" "}
          <a href="/registro" className="text-primary hover:underline">
            {t("registerLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
