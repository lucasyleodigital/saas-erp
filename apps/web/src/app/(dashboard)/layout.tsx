import { Suspense } from "react";
import { GoogleCallbackHandler } from "@/components/auth/google-callback-handler";
import { ApiKeepalive } from "@/components/layout/api-keepalive";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { UpdateBanner } from "@/components/layout/update-banner";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ImpersonationBanner />
      <Suspense fallback={null}>
        <GoogleCallbackHandler />
      </Suspense>
      <ApiKeepalive />
      <DashboardShell>{children}</DashboardShell>
      <AssistantWidget />
      <UpdateBanner />
    </>
  );
}
