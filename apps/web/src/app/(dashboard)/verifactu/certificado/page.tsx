import { CertificateWizard } from "@/components/verifactu/certificate-wizard";
import { Shield } from "lucide-react";

export const metadata = { title: "Certificado Digital — VeriFactu" };

export default function CertificadoPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Certificado digital VeriFactu</h1>
          <p className="text-sm text-muted-foreground">
            Necesario para firmar tus facturas y enviarlas a la AEAT
          </p>
        </div>
      </div>
      <CertificateWizard />
    </div>
  );
}
