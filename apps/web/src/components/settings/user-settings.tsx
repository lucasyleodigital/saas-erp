"use client";

import { useForm } from "react-hook-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth.store";
import { useUpdateProfile, useChangePassword } from "@/hooks/use-user";
import { Loader2, User, Lock, Bell, ShieldCheck, ShieldOff, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/lib/api";

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── 2FA Card ─────────────────────────────────────────────────────────────────

function TwoFactorCard() {
  const [step, setStep] = useState<"idle" | "setup" | "disable">("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  // Get 2FA status from /auth/me (user profile)
  useState(() => {
    api.get("/auth/me/profile").then((r: any) => setEnabled(r.data?.twoFactorEnabled ?? false)).catch(() => {});
  });

  async function startSetup() {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/2fa/setup");
      // Generate QR code image from otpauthUrl
      const QRCode = await import("qrcode");
      const url = await QRCode.default.toDataURL(data.otpauthUrl, { margin: 1, width: 180 });
      setQrDataUrl(url);
      setSecret(data.secret);
      setStep("setup");
    } catch {
      toast.error("Error al iniciar la configuracion de 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup() {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await api.post("/auth/2fa/verify", { token: code });
      setEnabled(true);
      setStep("idle");
      setCode("");
      toast.success("Verificacion en dos pasos activada");
    } catch {
      toast.error("Codigo incorrecto. Intentalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDisable() {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await api.post("/auth/2fa/disable", { code });
      setEnabled(false);
      setStep("idle");
      setCode("");
      toast.success("Verificacion en dos pasos desactivada");
    } catch {
      toast.error("Codigo incorrecto. Intentalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Verificacion en dos pasos (2FA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "idle" && (
          <>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? "La verificacion en dos pasos esta activa. Tu cuenta esta protegida con una capa extra de seguridad."
                : "Protege tu cuenta con Google Authenticator u otra app de autenticacion. Al iniciar sesion se pedira un codigo adicional."}
            </p>
            {enabled ? (
              <Button size="sm" variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setStep("disable"); setCode(""); }}>
                <ShieldOff className="h-4 w-4" />
                Desactivar 2FA
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="gap-2" onClick={startSetup} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                Activar 2FA
              </Button>
            )}
          </>
        )}

        {step === "setup" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escanea este codigo QR con <strong>Google Authenticator</strong>, <strong>Authy</strong> u otra app compatible.
            </p>
            {qrDataUrl && (
              <div className="flex justify-center">
                <img src={qrDataUrl} alt="QR 2FA" className="rounded-lg border border-border" width={180} height={180} />
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center break-all">
              Clave manual: <span className="font-mono text-foreground">{secret}</span>
            </p>
            <div className="space-y-2">
              <Label className="text-xs">Introduce el codigo de 6 digitos para confirmar</Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center font-mono tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={confirmSetup} disabled={loading || code.length !== 6}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirmar y activar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setStep("idle"); setCode(""); }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {step === "disable" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Introduce el codigo de tu app de autenticacion para desactivar el 2FA.
            </p>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center font-mono tracking-widest"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" className="flex-1" onClick={confirmDisable} disabled={loading || code.length !== 6}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Desactivar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setStep("idle"); setCode(""); }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UserSettings() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm({
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onPasswordSubmit(data: PasswordFormData) {
    if (data.newPassword !== data.confirmPassword) {
      toast.error(t("user.passwordMismatch"));
      return;
    }
    if (data.newPassword.length < 8) {
      toast.error(t("user.passwordMinLength"));
      return;
    }
    await changePassword.mutateAsync({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    passwordForm.reset();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("user.subtitle")}
        </p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">
            <User className="h-4 w-4 mr-2" />
            {t("profile")}
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            <Lock className="h-4 w-4 mr-2" />
            {t("security")}
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            <Bell className="h-4 w-4 mr-2" />
            {t("notifications")}
          </TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("user.personalData")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit((d) =>
                  updateProfile.mutate(d)
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-first">{t("user.firstName")}</Label>
                    <Input
                      id="p-first"
                      {...profileForm.register("firstName")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-last">{t("user.lastName")}</Label>
                    <Input
                      id="p-last"
                      {...profileForm.register("lastName")}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{tCommon("email")}</Label>
                  <Input
                    value={user?.email ?? ""}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("user.emailReadonly")}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {t("user.saveChanges")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="seguridad">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("user.changePassword")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="pwd-current">{t("user.currentPassword")}</Label>
                    <Input
                      id="pwd-current"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pwd-new">{t("user.newPassword")}</Label>
                    <Input
                      id="pwd-new"
                      type="password"
                      {...passwordForm.register("newPassword")}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("user.passwordHint")}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pwd-confirm">{t("user.confirmNewPassword")}</Label>
                    <Input
                      id="pwd-confirm"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={changePassword.isPending}
                    >
                      {changePassword.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      {t("user.changePassword")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <TwoFactorCard />
          </div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notificaciones">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("user.notifPreferences")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "overdueInvoices" },
                { key: "newLeads" },
                { key: "paymentsReceived" },
                { key: "weeklySummary" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{t(`user.notifItems.${item.key}.label`)}</p>
                    <p className="text-xs text-muted-foreground">{t(`user.notifItems.${item.key}.description`)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info(t("user.notifComingSoon"))}
                    className="h-5 w-9 rounded-full bg-primary/20 flex items-center justify-end px-0.5 cursor-pointer border-none"
                  >
                    <div className="h-4 w-4 rounded-full bg-primary" />
                  </button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                {t("user.notifDetailedComingSoon")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
