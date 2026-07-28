import type { Metadata } from "next";
import { CalendarTabs } from "@/components/calendar/calendar-tabs";

export const metadata: Metadata = { title: "Calendario" };

export default function CalendarPage() {
  return <CalendarTabs />;
}
