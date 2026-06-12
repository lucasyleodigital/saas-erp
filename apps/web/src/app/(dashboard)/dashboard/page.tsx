import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { TopClients } from "@/components/dashboard/top-clients";
import { DealsFunnel } from "@/components/dashboard/deals-funnel";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
      </div>

      <QuickActions />

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChart />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<ChartSkeleton />}>
            <DealsFunnel />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<TableSkeleton />}>
          <RecentInvoices />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <TopClients />
        </Suspense>
      </div>
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-80 rounded-xl bg-muted animate-pulse" />;
}

function TableSkeleton() {
  return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
}
