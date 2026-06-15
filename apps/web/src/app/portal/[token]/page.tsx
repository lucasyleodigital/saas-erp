import { Suspense } from "react";
import { ClientPortal } from "@/components/portal/client-portal";

export const metadata = { title: "Portal del cliente" };

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
        Cargando portal...
      </div>
    }>
      <ClientPortal token={token} />
    </Suspense>
  );
}
