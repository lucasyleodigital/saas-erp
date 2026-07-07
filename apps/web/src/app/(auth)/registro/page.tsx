import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://youwhole.com";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false },
  alternates: { canonical: `${APP_URL}/es/registro` },
};

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto">
            <Image src="/logo.png" alt="YouWhole" width={140} height={40} className="object-contain" />
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
