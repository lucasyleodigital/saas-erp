"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

/**
 * Handles the token returned by Google OAuth callback.
 * The API redirects to /dashboard?token=XXX after Google login.
 * This component picks it up, stores it, and cleans the URL.
 */
export function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;

    // Store token
    localStorage.setItem("access_token", token);
    document.cookie = `auth_session=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

    // Fetch user profile and set in store
    api.get("/auth/me").then(({ data }) => {
      setUser(data);
      // Clean the token from the URL without a full reload
      router.replace("/dashboard");
    }).catch(() => {
      router.replace("/login");
    });
  }, [searchParams, setUser, router]);

  return null;
}
