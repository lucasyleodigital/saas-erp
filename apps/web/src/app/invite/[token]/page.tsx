"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle, Loader2, AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

interface InvitationInfo {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
  };
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  ACCOUNTANT: "Contable",
  SALES: "Ventas",
  EMPLOYEE: "Empleado",
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    api.get(`/auth/invite/${token}`)
      .then((r) => setInvitation(r.data))
      .catch((e) => {
        setError(e?.response?.data?.message ?? "Invitación no válida o expirada");
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    try {
      const { data } = await api.post(`/auth/invite/${token}/accept`);
      // Store new access token
      localStorage.setItem("access_token", data.accessToken);
      setAccepted(true);
      toast.success(`Te has unido a ${invitation?.company.name}`);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Error al aceptar la invitación";
      // If 401 (not logged in), redirect to login with return URL
      if (e?.response?.status === 401) {
        router.push(`/login?redirect=/invite/${token}`);
        return;
      }
      toast.error(msg);
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-xl font-bold">Invitación no válida</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
              Ir al login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold">¡Bienvenido al equipo!</h1>
            <p className="text-sm text-muted-foreground">
              Te has unido a <strong>{invitation?.company.name}</strong>.<br />
              Redirigiendo al dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8 space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4">
              E
            </div>
            <h1 className="text-xl font-bold">Invitación al equipo</h1>
          </div>

          {/* Company info */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{invitation?.company.name}</p>
                <p className="text-xs text-muted-foreground">te ha invitado a unirte</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm pt-1 border-t border-border">
              <span className="text-muted-foreground">Email invitado</span>
              <span className="font-medium">{invitation?.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rol asignado</span>
              <span className="font-medium flex items-center gap-1">
                <Shield className="h-3 w-3 text-primary" />
                {ROLE_LABELS[invitation?.role ?? "EMPLOYEE"]}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aceptando...
                </>
              ) : (
                "Aceptar invitación"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Al aceptar necesitarás estar logueado en ERP SaaS.<br />
              Si no tienes cuenta, podrás crearla.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
