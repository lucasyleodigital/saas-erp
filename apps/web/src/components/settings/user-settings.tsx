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

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function UserSettings() {
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
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (data.newPassword.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres");
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
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona tu perfil personal y seguridad de la cuenta
        </p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            <Lock className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Datos personales</CardTitle>
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
                    <Label htmlFor="p-first">Nombre</Label>
                    <Input
                      id="p-first"
                      {...profileForm.register("firstName")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-last">Apellido</Label>
                    <Input
                      id="p-last"
                      {...profileForm.register("lastName")}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={user?.email ?? ""}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    El email no se puede cambiar por seguridad
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
                    Guardar cambios
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
                <CardTitle className="text-sm">Cambiar contraseña</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="pwd-current">Contraseña actual</Label>
                    <Input
                      id="pwd-current"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pwd-new">Nueva contraseña</Label>
                    <Input
                      id="pwd-new"
                      type="password"
                      {...passwordForm.register("newPassword")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo 8 caracteres, una mayúscula y un número
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pwd-confirm">Confirmar nueva contraseña</Label>
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
                      Cambiar contraseña
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Autenticación en dos pasos (2FA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Añade una capa extra de seguridad usando una app como Google
                  Authenticator o Authy.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.info("La autenticacion en dos pasos estara disponible proximamente")}
                >
                  Configurar 2FA
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notificaciones">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Preferencias de notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Facturas vencidas", description: "Aviso cuando una factura lleva mas de X dias sin pagar" },
                { label: "Nuevos leads", description: "Notificacion cuando se asigna un lead al equipo" },
                { label: "Pagos recibidos", description: "Confirmacion al registrar un pago en una factura" },
                { label: "Resumen semanal", description: "Email con el resumen de actividad de la semana" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info("Las preferencias de notificaciones estaran disponibles proximamente")}
                    className="h-5 w-9 rounded-full bg-primary/20 flex items-center justify-end px-0.5 cursor-pointer border-none"
                  >
                    <div className="h-4 w-4 rounded-full bg-primary" />
                  </button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Las preferencias detalladas estaran disponibles proximamente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
