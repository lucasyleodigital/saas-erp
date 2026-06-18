import { Suspense } from "react";
import { GoogleCallbackHandler } from "@/components/auth/google-callback-handler";
import { ApiKeepalive } from "@/components/layout/api-keepalive";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <GoogleCallbackHandler />
      </Suspense>
      <ApiKeepalive />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
