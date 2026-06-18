"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const hash = window.location.hash;
    const token = hash ? new URLSearchParams(hash.substring(1)).get("access_token") : null;

    if (!token) {
      router.replace("/es/login");
      return;
    }

    localStorage.setItem("access_token", token);
    // auth_session cookie is what the Next.js middleware reads to protect routes
    document.cookie = `auth_session=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    window.history.replaceState(null, "", window.location.pathname);

    api.get("/auth/me")
      .then(({ data }) => {
        setUser(data);
        router.replace("/es/dashboard");
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        document.cookie = "auth_session=; path=/; max-age=0; SameSite=Lax";
        router.replace("/es/login");
      });
  }, [setUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Iniciando sesión...</p>
      </div>
    </div>
  );
}
