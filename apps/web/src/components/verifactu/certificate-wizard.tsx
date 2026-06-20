"use client";

import { useRef, useState } from "react";
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
          {info.isExpired ? "Certificado caducado" : "Certificado configurado"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {info.isExpired
            ? "Debes subir un certificado nuevo para seguir generando VeriFactu"
            : "Tus facturas se firman automáticamente con tu certificado digital"}
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Empresa / Titular</p>
              <p className="font-medium mt-0.5">{info.subject || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CIF / NIF</p>
              <p className="font-medium mt-0.5 font-mono">{info.nif || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Válido hasta</p>
              <p className={cn("font-medium mt-0.5", info.isExpired ? "text-red-500" : expiring ? "text-amber-500" : "")}>
                {formatDate(info.expiresAt)}
                {info.isExpired && " (CADUCADO)"}
                {expiring && ` (quedan ${info.daysLeft} días)`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subido el</p>
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
                ? "Este certificado ha caducado. Renuévalo en la FNMT y súbelo de nuevo para que VeriFactu siga funcionando."
                : `Tu certificado caduca en ${info.daysLeft} días. Renuévalo pronto para no interrumpir la firma automática.`}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button onClick={onReplace} className="flex-1 gap-2">
          <RefreshCw className="h-4 w-4" />
          {info.isExpired ? "Subir certificado nuevo" : "Cambiar certificado"}
        </Button>
        <Button
          variant="outline"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={() => deleteMut.mutate()}
          disabled={deleteMut.isPending}
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </div>
    </div>
  );
}

// ── Choose screen ────────────────────────────────────────────────────────────

function ChooseScreen({ onSelect }: { onSelect: (s: Screen) => void }) {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Configura tu certificado digital</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          El certificado digital es como un DNI electrónico de tu empresa.
          Lo emite la FNMT (Fábrica Nacional de Moneda y Timbre) y permite firmar tus facturas para AEAT.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">¿En qué situación estás?</p>

        <button
          onClick={() => onSelect("upload")}
          className="w-full flex items-center gap-4 p-5 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Upload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Tengo el archivo .p12 o .pfx</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ya lo he descargado de la FNMT o me lo ha dado mi gestor
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
            <p className="font-semibold">Lo tengo instalado en el ordenador o el navegador</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Lo uso para otros trámites pero no tengo el archivo .p12
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
            <p className="font-semibold">No tengo certificado digital</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Necesito obtener uno. Te explico cómo en 4 pasos sencillos
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
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveMut = useSaveCertificate();

  function handleFile(f: File) {
    if (!f.name.match(/\.(p12|pfx)$/i)) {
      alert("Por favor, selecciona un archivo .p12 o .pfx");
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
          ← Volver
        </button>
        <h2 className="text-xl font-bold">Sube tu certificado digital</h2>
        <p className="text-sm text-muted-foreground mt-1">
          El archivo tiene extensión <strong>.p12</strong> o <strong>.pfx</strong>.
          Lo habrás descargado de la sede de la FNMT o de tu gestor.
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
                {(file.size / 1024).toFixed(0)} KB — haz clic para cambiar
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-sm">Arrastra tu archivo .p12 o .pfx aquí</p>
              <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionarlo</p>
            </>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Contraseña del certificado</label>
          <p className="text-xs text-muted-foreground">
            Es la contraseña que pusiste al descargar o exportar el certificado.
            Si no la recuerdas, tendrás que pedir uno nuevo a la FNMT.
          </p>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              required
              placeholder="Contraseña del certificado"
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
                {(saveMut.error as any)?.response?.data?.message ?? "Error al guardar el certificado"}
              </p>
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full h-11" disabled={!file || !password || saveMut.isPending}>
          {saveMut.isPending ? "Validando y guardando..." : "Guardar certificado"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Tu certificado se almacena cifrado con AES-256. Nunca se comparte con terceros.
        </p>
      </form>
    </div>
  );
}

// ── Guide: export from browser / Windows ─────────────────────────────────────

function GuideExportScreen({ onBack, onGotFile }: { onBack: () => void; onGotFile: () => void }) {
  const steps = [
    {
      title: "Chrome o Edge (Windows/Mac)",
      steps: [
        "Abre Chrome → tres puntos arriba a la derecha → Configuración",
        "Busca \"Privacidad y seguridad\" → Seguridad → Gestionar certificados",
        "En la pestaña \"Personal\", selecciona tu certificado",
        "Haz clic en \"Exportar\" y sigue el asistente",
        "Elige guardar con clave privada y formato .p12 (PKCS#12)",
        "Escribe una contraseña para protegerlo — la necesitarás aquí",
      ],
    },
    {
      title: "Firefox",
      steps: [
        "Menú (tres rayas) → Ajustes → Privacidad y Seguridad",
        "Baja hasta \"Certificados\" → Ver certificados",
        "Pestaña \"Sus certificados\" → selecciona el tuyo",
        "Haz clic en \"Copia de seguridad\" y guárdalo como .p12",
        "Asigna una contraseña cuando te la pida",
      ],
    },
    {
      title: "Windows (sin navegador)",
      steps: [
        "Pulsa Windows+R, escribe certmgr.msc y pulsa Enter",
        "Expande \"Personal\" → \"Certificados\"",
        "Haz clic derecho en tu certificado → Todas las tareas → Exportar",
        "Asistente: Sí, exportar la clave privada → formato .PFX",
        "Asigna una contraseña y guarda el archivo",
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
          ← Volver
        </button>
        <h2 className="text-xl font-bold">Cómo exportar tu certificado</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sigue las instrucciones de tu navegador o sistema para exportar el certificado
          a un archivo .p12 o .pfx, y después súbelo aquí.
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
        Ya tengo el archivo .p12 — subir ahora
      </Button>
    </div>
  );
}

// ── Guide: get certificate from FNMT ─────────────────────────────────────────

function GuideFnmtScreen({ onBack }: { onBack: () => void }) {
  const steps = [
    {
      num: "1",
      title: "Solicita el certificado online",
      desc: "Entra en sede.fnmt.es → Certificados → Certificado de representante de persona jurídica (para empresas) o Certificado de persona física (para autónomos con DNI). Haz clic en \"Solicitar certificado\" y anota el código que te dan.",
      link: "https://www.sede.fnmt.gob.es/certificados",
    },
    {
      num: "2",
      title: "Acude a acreditar tu identidad",
      desc: "Con ese código ve presencialmente a cualquier oficina de la AEAT, Registro Civil o Seguridad Social. Lleva tu DNI o NIE y el CIF de la empresa. El proceso dura 10-15 minutos.",
    },
    {
      num: "3",
      title: "Descarga el certificado",
      desc: "Después de la visita, vuelve a sede.fnmt.es → \"Descargar certificado\". Introduce el código que te dieron y descárgalo. Esto instala el certificado en tu navegador.",
      link: "https://www.sede.fnmt.gob.es/certificados/persona-juridica/obtener-certificado-de-representante/descarga",
    },
    {
      num: "4",
      title: "Expórtalo a .p12 y súbelo aquí",
      desc: "Con el certificado instalado en el navegador, sigue la guía de exportación (clic en \"Lo tengo en el navegador\") para obtener el archivo .p12. Luego sube ese archivo aquí.",
    },
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
          ← Volver
        </button>
        <h2 className="text-xl font-bold">Cómo obtener tu certificado digital</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Es más fácil de lo que parece. En total te llevará unos 30-60 minutos
          (incluyendo el desplazamiento a la oficina).
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
                  Ir a sede.fnmt.es <ExternalLink className="h-3 w-3" />
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
            <p className="font-medium">¿Tu gestor o asesoría lleva la contabilidad?</p>
            <p className="mt-0.5">
              Puedes pedirle que te exporte el archivo .p12 del certificado que ya tienen de tu empresa.
              Es la opción más rápida si ya tienen uno.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onBack} variant="outline" className="w-full">
        Volver — ya tengo el certificado
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
