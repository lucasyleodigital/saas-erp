"use client";

import { useVerifactuRecords } from "@/hooks/use-verifactu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Shield, ShieldCheck, ShieldAlert,
  CheckCircle2, Clock, AlertCircle,
  ExternalLink, FileText, Copy, Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { useCertificateInfo } from "@/hooks/use-verifactu";
import { useTranslations } from "next-intl";

const _STATUS_MAP = {
  GENERATED: { labelKey: "statusLabels.GENERATED",  variant: "secondary",    icon: Clock },
  SIGNED:    { labelKey: "statusLabels.SIGNED",   variant: "info",         icon: Clock },
  SENT:      { labelKey: "statusLabels.SENT",   variant: "info",         icon: Clock },
  ACCEPTED:  { labelKey: "statusLabels.ACCEPTED",  variant: "success",      icon: CheckCircle2 },
  REJECTED:  { labelKey: "statusLabels.REJECTED", variant: "destructive",  icon: AlertCircle },
};

const STATUS_CONFIG = _STATUS_MAP as Record<string, { labelKey: string; variant: any; icon: any }>;

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? _STATUS_MAP.GENERATED;
}

export function VerifactuView() {
  const t = useTranslations("verifactuView");
  const { data, isLoading } = useVerifactuRecords();
  const { data: certInfo } = useCertificateInfo();

  const records = data?.records ?? [];
  const stats = data?.stats;
  const certExpiring = certInfo && !certInfo.isExpired && certInfo.daysLeft !== null && certInfo.daysLeft <= 30;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            VeriFactu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href="/verifactu/certificado">
            <Settings className="h-4 w-4" />
            {t("digitalCert")}
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("totalRecords")}</p>
            <p className="text-2xl font-bold mt-1">{stats?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("generated")}</p>
            <p className="text-2xl font-bold mt-1 text-blue-500">{stats?.generated ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("sentRecords")}</p>
            <p className="text-2xl font-bold mt-1 text-amber-500">{stats?.sent ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("accepted")}</p>
            <p className="text-2xl font-bold mt-1 text-emerald-500">{stats?.accepted ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Certificate status banner */}
      {!certInfo ? (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3 justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-300">{t("certNotConfigured")}</p>
                <p className="text-amber-600 dark:text-amber-400 mt-0.5">
                  {t("certNotConfiguredDesc")}
                </p>
              </div>
            </div>
            <Button size="sm" asChild className="shrink-0 gap-2">
              <Link href="/verifactu/certificado">
                {t("configureNow")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : certInfo.isExpired ? (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-center gap-3 justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-700 dark:text-red-300">{t("certExpired")}</p>
                <p className="text-red-600 dark:text-red-400 mt-0.5">
                  {t("certExpiredDesc", { date: new Date(certInfo.expiresAt!).toLocaleDateString("es-ES") })}
                </p>
              </div>
            </div>
            <Button size="sm" variant="destructive" asChild className="shrink-0">
              <Link href="/verifactu/certificado">{t("renew")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : certExpiring ? (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3 justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  {t("certExpiring", { days: certInfo.daysLeft ?? 0 })}
                </p>
                <p className="text-amber-600 dark:text-amber-400 mt-0.5">
                  {t("certExpiringDesc", { date: new Date(certInfo.expiresAt!).toLocaleDateString("es-ES") })}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="shrink-0">
              <Link href="/verifactu/certificado">{t("viewCert")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                {t("certActive", { subject: certInfo.subject })}
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                {t("certActiveDesc", { date: new Date(certInfo.expiresAt!).toLocaleDateString("es-ES") })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info banner */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-300">
              {t("regulation")}
            </p>
            <p className="text-blue-600 dark:text-blue-400 mt-0.5">
              {t("regulationDesc")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Records table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("recordHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">{t("noRecords")}</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {t("noRecordsDesc")}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/facturas">
                  <FileText className="h-4 w-4 mr-2" />
                  {t("goToInvoices")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("invoice")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">{t("client")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">{t("date")}</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">{t("amount")}</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">{t("hash")}</th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, i) => {
                    const cfg = getStatusConfig(record.status);
                    const Icon = cfg.icon;
                    return (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/facturas/${record.invoiceId}`}
                            className="font-mono text-xs font-medium text-primary hover:underline"
                          >
                            {record.invoice?.number ?? "—"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          {record.invoice?.client?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-right font-semibold">
                          {record.invoice?.total ? formatCurrency(Number(record.invoice.total)) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted/50 rounded px-1 py-0.5">
                              {record.hash.slice(0, 16)}...
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => {
                                navigator.clipboard.writeText(record.hash);
                                toast.success(t("hashCopied"));
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={cfg.variant} className="gap-1">
                            <Icon className="h-3 w-3" />
                            {t(cfg.labelKey)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {record.qrCode && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={record.qrCode} target="_blank" rel="noopener noreferrer" title={t("verifyAeat")}>
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
