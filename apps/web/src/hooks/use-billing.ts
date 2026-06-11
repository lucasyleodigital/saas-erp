import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useCheckout() {
  return useMutation({
    mutationFn: async (plan: "STARTER" | "PRO" | "ENTERPRISE") => {
      const { data } = await api.post("/billing/checkout", {
        plan,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing?cancelled=true`,
      });
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Error al iniciar el pago";
      toast.error(msg);
    },
  });
}

export function useCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/billing/portal", {
        returnUrl: window.location.href,
      });
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: () => toast.error("Error al abrir el portal de facturación"),
  });
}
