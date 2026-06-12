import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GoogleCallbackHandler } from "@/components/auth/google-callback-handler";

// Never statically pre-render dashboard pages:
// - They require authentication (middleware redirects unauthenticated users)
// - Sidebar uses useTranslations() which needs NextIntlClientProvider at runtime
// - All data is fetched dynamically from the API
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Handles ?token= from Google OAuth redirect */}
      <Suspense fallback={null}>
        <GoogleCallbackHandler />
      </Suspense>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
