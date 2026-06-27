"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/lib/auth";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const LOCALES = ["es", "ca", "eu", "gl", "en"];

const schema = z.object({
  firstName:   z.string().min(1),
  lastName:    z.string().min(1),
  companyName: z.string().min(2),
  email:       z.string().email(),
  password:    z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router   = useRouter();
  const pathname = usePathname();
  const t        = useTranslations("auth.register");
  const tCommon  = useTranslations("common");
  const setUser  = useAuthStore((s) => s.setUser);

  const segments = pathname.split("/");
  const locale   = LOCALES.includes(segments[1] ?? "") ? segments[1]! : "es";

  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setFormError("");
    try {
      await registerAction(data);
      const { data: me } = await api.get("/auth/me");
      setUser(me);
      trackEvent("sign_up", { method: "email" });
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? t("error");
      const errorText = Array.isArray(msg) ? msg[0] : msg;
      setFormError(errorText);
      toast.error(errorText);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {formError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t("firstName")} *</Label>
          <Input id="firstName" {...register("firstName")} placeholder="Lucas" />
          {errors.firstName && (
            <p className="text-xs text-destructive">{tCommon("required")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">{t("lastName")} *</Label>
          <Input id="lastName" {...register("lastName")} placeholder="García" />
          {errors.lastName && (
            <p className="text-xs text-destructive">{tCommon("required")}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="companyName">{t("company")} *</Label>
        <Input id="companyName" {...register("companyName")} placeholder="Mi empresa SL" />
        {errors.companyName && (
          <p className="text-xs text-destructive">{tCommon("required")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")} *</Label>
        <Input id="email" type="email" {...register("email")} placeholder="tu@empresa.com" autoComplete="email" />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")} *</Label>
        <Input id="password" type="password" {...register("password")} placeholder="••••••••" autoComplete="new-password" />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {isSubmitting ? t("loading") : t("submit")}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {t("terms")}
      </p>
    </form>
  );
}
