import { Suspense } from "react";
import { ClientPortal } from "@/components/portal/client-portal";

export const metadata = { title: "Portal del cliente" };

export default function PortalPage({ params }: { params: { token: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
        Cargando portal...
      </div>
    }>
      <ClientPortal token={params.token} />
    </Suspense>
  );
}
