"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,   // datos "frescos" durante 5 min → no refetcha al volver
            gcTime: 30 * 60 * 1000,      // cache en memoria 30 min → navegación instantánea
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,        // si los datos son frescos, no vuelve a pedir
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
