"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { toast } from "sonner";

function getErrorMessage(error: unknown): string {
  if (!error) return "Ha ocurrido un error inesperado";
  const err = error as any;
  const msg = err?.response?.data?.message ?? err?.message;
  if (!msg) return "Ha ocurrido un error inesperado";
  if (Array.isArray(msg)) return msg.join(", ");
  if (msg.includes("Unauthorized") || msg.includes("401")) return "Sesión expirada. Vuelve a iniciar sesión.";
  if (msg.includes("Network") || msg.includes("ECONNREFUSED")) return "Sin conexión con el servidor.";
  return msg;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
          mutations: {
            onError: (error) => {
              toast.error(getErrorMessage(error));
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
