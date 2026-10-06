import { api } from "./api";
import { useAuthStore } from "@/store/auth.store";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function setAuthCookie(token: string) {
  document.cookie = `auth_session=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = "auth_session=; path=/; max-age=0; SameSite=Lax";
}

export type LoginResponse =
  | { requires2FA: false; accessToken: string }
  | { requires2FA: true; pendingToken: string };

export async function loginAction(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<{ accessToken?: string; requires2FA?: boolean; pendingToken?: string }>(
    "/auth/login",
    { email, password }
  );
  if (data.requires2FA) {
    return { requires2FA: true, pendingToken: data.pendingToken! };
  }
  localStorage.setItem("access_token", data.accessToken!);
  setAuthCookie(data.accessToken!);
  return { requires2FA: false, accessToken: data.accessToken! };
}

export async function complete2FALoginAction(pendingToken: string, code: string): Promise<void> {
  const { data } = await api.post<{ accessToken: string }>("/auth/2fa/complete", {
    pendingToken,
    code,
  });
  localStorage.setItem("access_token", data.accessToken);
  setAuthCookie(data.accessToken);
}

export async function registerAction(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  acceptTerms: boolean;
  recaptchaToken?: string;
}) {
  const { data } = await api.post<{ accessToken: string }>("/auth/register", payload);
  localStorage.setItem("access_token", data.accessToken);
  setAuthCookie(data.accessToken);
  return data;
}

export async function logoutAction() {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore errors on logout
  }
  localStorage.removeItem("access_token");
  clearAuthCookie();
  useAuthStore.getState().logout();
  window.location.href = "/login";
}
