import type { Metadata } from "next";
import { WebhooksView } from "@/components/webhooks/webhooks-view";

export const metadata: Metadata = { title: "Webhooks" };

export default function WebhooksPage() {
  return <WebhooksView />;
}
