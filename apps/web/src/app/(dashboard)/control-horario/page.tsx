import type { Metadata } from "next";
import { TimeTrackingView } from "@/components/time-tracking/time-tracking-view";

export const metadata: Metadata = { title: "Control horario" };

export default function TimeTrackingPage() {
  return <TimeTrackingView />;
}
