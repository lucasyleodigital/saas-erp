import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SearchResult {
  id: string;
  type: "client" | "invoice" | "quote" | "product" | "employee" | "delivery-note";
  label: string;
  sublabel?: string;
  href: string;
}

export function useSearch(q: string) {
  return useQuery<SearchResult[]>({
    queryKey: ["search", q],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
    placeholderData: [],
  });
}
