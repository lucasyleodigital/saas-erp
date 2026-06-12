import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");

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
        <RegisterForm />
        <p className="text-center text-xs text-muted-foreground">
          {t("hasAccount")}{" "}
          <a href="/login" className="text-primary hover:underline">
            {t("loginLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
