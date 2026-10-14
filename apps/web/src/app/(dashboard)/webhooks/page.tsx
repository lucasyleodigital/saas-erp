import type { Metadata } from "next";
import { WebhooksView } from "@/components/webhooks/webhooks-view";
import { PlanGate } from "@/components/billing/plan-gate";

export const metadata: Metadata = { title: "Webhooks" };

export default function WebhooksPage() {
  return (
    <PlanGate feature="hasApiAccess">
      <WebhooksView />
    </PlanGate>
  );
}
