"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useCertificateInfo,
  useSaveCertificate,
  useDeleteCertificate,
  type CertificateInfo,
} from "@/hooks/use-verifactu";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield, ShieldCheck, ShieldAlert, Upload, Eye, EyeOff,
  CheckCircle2, AlertCircle, ChevronRight, ExternalLink,
  RefreshCw, Trash2, Monitor, Globe, HelpCircle,
} from "lucide-react";

type Screen =
  | "loading"
  | "configured"
  | "choose"
  | "upload"
  | "guide_export"
  | "guide_fnmt";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Configured screen ───────────────────────────────────────────────────────

function ConfiguredScreen({
  info,
  onReplace,
}: {
  info: CertificateInfo;
  onReplace: () => void;
}) {
  const t = useTranslations("verifactu");
  const tCommon = useTranslations("common");
  const deleteMut = useDeleteCertificate();
  const expiring = info.daysLeft !== null && info.daysLeft <= 30 && !info.isExpired;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        {info.isExpired ? (
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
        ) : (
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/20 mb-4">
            <ShieldCheck className="h-10 w-10 text-emerald-500" />
          </div>
        )}
        <h2 className="text-xl font-bold">
          {info.isExpired ? t("cert.expired") : t("cert.configured")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {info.isExpired
            ? t("cert.expiredDesc")
            : t("cert.configuredDesc")}
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("cert.holder")}</p>
              <p className="font-medium mt-0.5">{info.subject || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("cert.cifNif")}</p>
              <p className="font-medium mt-0.5 font-mono">{info.nif || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("cert.validUntil")}</p>
              <p className={cn("font-medium mt-0.5", info.isExpired ? "text-red-500" : expiring ? "text-amber-500" : "")}>
                {formatDate(info.expiresAt)}
                {info.isExpired && ` ${t("cert.expiredTag")}`}
                {expiring && ` ${t("cert.daysLeft", { days: info.daysLeft ?? 0 })}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("cert.uploadedAt")}</p>
              <p className="font-medium mt-0.5">{formatDate(info.uploadedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(info.isExpired || expiring) && (
        <Card className={cn(
          "border",
          info.isExpired
            ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
            : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20",
        )}>
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className={cn("h-5 w-5 shrink-0 mt-0.5", info.isExpired ? "text-red-500" : "text-amber-500")} />
            <p className={cn("text-sm", info.isExpired ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300")}>
              {info.isExpired
                ? t("cert.expiredWarning")
                : t("cert.expiringWarning", { days: info.daysLeft ?? 0 })}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button onClick={onReplace} className="flex-1 gap-2">
          <RefreshCw className="h-4 w-4" />
          {info.isExpired ? t("cert.uploadNew") : t("cert.changeCert")}
        </Button>
        <Button
          variant="outline"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={() => deleteMut.mutate()}
          disabled={deleteMut.isPending}
        >
          <Trash2 className="h-4 w-4" />
          {tCommon("delete")}
        </Button>
      </div>
    </div>
  );
}

// ── Choose screen ────────────────────────────────────────────────────────────

function ChooseScreen({ onSelect }: { onSelect: (s: Screen) => void }) {
  const t = useTranslations("verifactu");

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">{t("cert.configure")}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          {t("cert.configureDesc")}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("cert.whichSituation")}</p>

        <button
          onClick={() => onSelect("upload")}
          className="w-full flex items-center gap-4 p-5 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Upload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{t("cert.haveFile")}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("cert.haveFileDesc")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        <button
          onClick={() => onSelect("guide_export")}
          className="w-full flex items-center gap-4 p-5 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{t("cert.installedInBrowser")}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("cert.installedInBrowserDesc")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        <button
          onClick={() => onSelect("guide_fnmt")}
          className="w-full flex items-center gap-4 p-5 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <HelpCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{t("cert.noCert")}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("cert.noCertDesc")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>
    </div>
  );
}

// ── Upload screen ─────────────────────────────────────────────────────────────

function UploadScreen({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const t = useTranslations("verifactu");
  const tCommon = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveMut = useSaveCertificate();

  function handleFile(f: File) {
    if (!f.name.match(/\.(p12|pfx)$/i)) {
      alert(t("cert.invalidFileType"));
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !password) return;
    await saveMut.mutateAsync({ file, password });
    onSuccess();
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
          ← {tCommon("back")}
        </button>
        <h2 className="text-xl font-bold">{t("cert.uploadTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t.rich("cert.uploadDesc", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
            file
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
              : dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".p12,.pfx"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ""; } }}
          />
          {file ? (
            <>
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("cert.fileSize", { size: (file.size / 1024).toFixed(0) })}
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-sm">{t("cert.dragFile")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("cert.orClickToSelect")}</p>
            </>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("cert.certPassword")}</label>
          <p className="text-xs text-muted-foreground">
            {t("cert.certPasswordDesc")}
          </p>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              required
              placeholder={t("cert.certPasswordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {saveMut.isError && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {(saveMut.error as any)?.response?.data?.message ?? t("cert.saveError")}
              </p>
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full h-11" disabled={!file || !password || saveMut.isPending}>
          {saveMut.isPending ? t("cert.saving") : t("cert.saveCert")}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {t("cert.securityNote")}
        </p>
      </form>
    </div>
  );
}

// ── Guide: export from browser / Windows ─────────────────────────────────────

function GuideExportScreen({ onBack, onGotFile }: { onBack: () => void; onGotFile: () => void }) {
  const t = useTranslations("verifactu");
  const tCommon = useTranslations("common");

  const steps = [
    {
      title: t("cert.chromeTitle"),
      steps: [
        t("cert.chromeStep1"),
        t("cert.chromeStep2"),
        t("cert.chromeStep3"),
        t("cert.chromeStep4"),
        t("cert.chromeStep5"),
        t("cert.chromeStep6"),
      ],
    },
    {
      title: t("cert.firefoxTitle"),
      steps: [
        t("cert.firefoxStep1"),
        t("cert.firefoxStep2"),
        t("cert.firefoxStep3"),
        t("cert.firefoxStep4"),
        t("cert.firefoxStep5"),
      ],
    },
    {
      title: t("cert.windowsTitle"),
      steps: [
        t("cert.windowsStep1"),
        t("cert.windowsStep2"),
        t("cert.windowsStep3"),
        t("cert.windowsStep4"),
        t("cert.windowsStep5"),
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
          ← {tCommon("back")}
        </button>
        <h2 className="text-xl font-bold">{t("cert.exportTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("cert.exportDesc")}
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((browser) => (
          <Card key={browser.title}>
            <CardContent className="p-5">
              <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                {browser.title}
              </p>
              <ol className="space-y-2">
                {browser.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={onGotFile} className="w-full gap-2">
        <Upload className="h-4 w-4" />
        {t("cert.gotFileUploadNow")}
      </Button>
    </div>
  );
}

// ── Guide: get certificate from FNMT ─────────────────────────────────────────

function GuideFnmtScreen({ onBack }: { onBack: () => void }) {
  const t = useTranslations("verifactu");
  const tCommon = useTranslations("common");

  const steps = [
    {
      num: "1",
      title: t("cert.fnmtStep1Title"),
      desc: t("cert.fnmtStep1Desc"),
      link: "https://www.sede.fnmt.gob.es/certificados",
    },
    {
      num: "2",
      title: t("cert.fnmtStep2Title"),
      desc: t("cert.fnmtStep2Desc"),
    },
    {
      num: "3",
      title: t("cert.fnmtStep3Title"),
      desc: t("cert.fnmtStep3Desc"),
      link: "https://www.sede.fnmt.gob.es/certificados/persona-juridica/obtener-certificado-de-representante/descarga",
    },
    {
      num: "4",
      title: t("cert.fnmtStep4Title"),
      desc: t("cert.fnmtStep4Desc"),
    },
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
          ← {tCommon("back")}
        </button>
        <h2 className="text-xl font-bold">{t("cert.obtainTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("cert.obtainDesc")}
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.num} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step.num}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
              {step.link && (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                >
                  {t("cert.goToFnmt")} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Globe className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">{t("cert.accountantQuestion")}</p>
            <p className="mt-0.5">
              {t("cert.accountantDesc")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onBack} variant="outline" className="w-full">
        {t("cert.backHaveCert")}
      </Button>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export function CertificateWizard() {
  const { data: certInfo, isLoading } = useCertificateInfo();
  const [screen, setScreen] = useState<Screen | null>(null);

  // Determine initial screen once data loads
  const activeScreen: Screen = (() => {
    if (isLoading) return "loading";
    if (screen) return screen;
    return certInfo ? "configured" : "choose";
  })();

  if (activeScreen === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <Shield className="h-8 w-8 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  if (activeScreen === "configured" && certInfo && !screen) {
    return (
      <ConfiguredScreen
        info={certInfo}
        onReplace={() => setScreen("upload")}
      />
    );
  }

  if (activeScreen === "choose") {
    return <ChooseScreen onSelect={(s) => setScreen(s)} />;
  }

  if (activeScreen === "upload") {
    return (
      <UploadScreen
        onBack={() => setScreen(certInfo ? "configured" : "choose")}
        onSuccess={() => setScreen(null)} // null → re-derive → "configured"
      />
    );
  }

  if (activeScreen === "guide_export") {
    return (
      <GuideExportScreen
        onBack={() => setScreen("choose")}
        onGotFile={() => setScreen("upload")}
      />
    );
  }

  if (activeScreen === "guide_fnmt") {
    return <GuideFnmtScreen onBack={() => setScreen("choose")} />;
  }

  return null;
}
