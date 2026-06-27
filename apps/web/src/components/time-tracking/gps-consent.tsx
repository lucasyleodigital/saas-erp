"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Shield, Info } from "lucide-react";

const GPS_CONSENT_KEY = "youwhole_gps_consent";

export function useGpsConsent() {
  const [consented, setConsented] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(GPS_CONSENT_KEY);
    setConsented(stored === "true" ? true : stored === "false" ? false : null);
  }, []);

  function accept() {
    localStorage.setItem(GPS_CONSENT_KEY, "true");
    setConsented(true);
  }

  function reject() {
    localStorage.setItem(GPS_CONSENT_KEY, "false");
    setConsented(false);
  }

  return { consented, accept, reject };
}

export function GpsConsentBanner({ onAccept, onReject }: { onAccept: () => void; onReject: () => void }) {
  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">Geolocalizacion al fichar</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Tu empresa utiliza YouWhole para el registro de jornada laboral.
              Al fichar entrada o salida, se puede registrar tu ubicacion
              para cumplir con la normativa de control horario.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Solo se registra al momento de fichar, no hay rastreo continuo</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Puedes rechazar el GPS y fichar sin ubicacion</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Cumple con la LOPDGDD y el RGPD</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-blue-500 shrink-0" />
            <span>Puedes cambiar esta decision en cualquier momento desde Configuracion</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onAccept} className="gap-2">
            <MapPin className="h-4 w-4" /> Aceptar geolocalizacion
          </Button>
          <Button variant="outline" onClick={onReject}>
            Fichar sin ubicacion
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Base legal: Art. 90 LOPDGDD, Art. 20.3 Estatuto de los Trabajadores.
          Responsable: tu empresa. Finalidad: registro de jornada laboral.
          Puedes ejercer tus derechos ARCO escribiendo a tu empresa.
        </p>
      </CardContent>
    </Card>
  );
}
