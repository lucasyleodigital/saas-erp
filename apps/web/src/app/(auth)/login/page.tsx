import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto">
            E
          </div>
          <h1 className="text-2xl font-bold">Bienvenido</h1>
          <p className="text-muted-foreground text-sm">
            Inicia sesión en tu cuenta
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <a href="/registro" className="text-primary hover:underline">
            Regístrate gratis
          </a>
        </p>
      </div>
    </div>
  );
}
