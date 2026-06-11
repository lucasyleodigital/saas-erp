import { api } from "./api";
import { useAuthStore } from "@/store/auth.store";

export async function loginAction(email: string, password: string) {
  const { data } = await api.post<{ accessToken: string }>("/auth/login", {
    email,
    password,
  });
  localStorage.setItem("access_token", data.accessToken);
  return data;
}

export async function registerAction(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}) {
  const { data } = await api.post<{ accessToken: string }>("/auth/register", payload);
  localStorage.setItem("access_token", data.accessToken);
  return data;
}

export async function logoutAction() {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore errors on logout
  }
  localStorage.removeItem("access_token");
  useAuthStore.getState().logout();
  window.location.href = "/login";
}
