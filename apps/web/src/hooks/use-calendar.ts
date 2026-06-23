import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCalendarEvents(month: number, year: number) {
  return useQuery({
    queryKey: ["calendar", "events", month, year],
    queryFn: () =>
      api.get("/calendar/events", { params: { month, year } }).then((r) => r.data),
  });
}
