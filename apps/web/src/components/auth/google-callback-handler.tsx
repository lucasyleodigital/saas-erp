"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

export function GoogleCallbackHandler() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    // Token arrives in URL fragment (#access_token=...) — never reaches server logs or Referer headers
    const hash = window.location.hash;
    const token = hash ? new URLSearchParams(hash.substring(1)).get("access_token") : null;
    if (!token) return;

    localStorage.setItem("access_token", token);
    // Remove fragment from URL immediately
    window.history.replaceState(null, "", window.location.pathname);

    api.get("/auth/me").then(({ data }) => {
      setUser(data);
    }).catch(() => {
      router.replace("/login");
    });
  }, [setUser, router]);

  return null;
}
