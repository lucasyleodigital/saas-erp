import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCurrencyRates(base: string = "EUR") {
  return useQuery({
    queryKey: ["currency", "rates", base],
    queryFn: () => api.get("/currency/rates", { params: { base } }).then((r) => r.data),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useConvertCurrency(amount: number, from: string, to: string) {
  return useQuery({
    queryKey: ["currency", "convert", amount, from, to],
    queryFn: () => api.get("/currency/convert", { params: { amount, from, to } }).then((r) => r.data),
    enabled: amount > 0 && from !== to,
  });
}
