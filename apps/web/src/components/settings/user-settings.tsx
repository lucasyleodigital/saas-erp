"use client";

import { useForm } from "react-hook-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth.store";
import { useUpdateProfile, useChangePassword } from "@/hooks/use-user";
import { Loader2, User, Lock, Bell } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {t("user.twoFactorTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("user.twoFactorDescription")}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.info(t("user.twoFactorComingSoon"))}
                >
                  {t("user.configure2FA")}
                </Button>
              </CardContent>
            </Card>
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
