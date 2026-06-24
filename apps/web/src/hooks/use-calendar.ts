import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCalendarEvents(month: number, year: number) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return useQuery({
    queryKey: ["calendar", "events", month, year],
    queryFn: () =>
      api.get("/calendar/events", { params: { from, to } }).then((r) => r.data),
  });
}
