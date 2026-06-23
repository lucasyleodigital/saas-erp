"use client";

import { useCurrencyRates } from "@/hooks/use-currency";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Coins, Loader2 } from "lucide-react";

const CURRENCIES = [
  { code: "EUR", label: "EUR - Euro" },
  { code: "USD", label: "USD - Dolar estadounidense" },
  { code: "GBP", label: "GBP - Libra esterlina" },
  { code: "CHF", label: "CHF - Franco suizo" },
  { code: "SEK", label: "SEK - Corona sueca" },
  { code: "DKK", label: "DKK - Corona danesa" },
  { code: "NOK", label: "NOK - Corona noruega" },
  { code: "PLN", label: "PLN - Zloty polaco" },
  { code: "CZK", label: "CZK - Corona checa" },
  { code: "RON", label: "RON - Leu rumano" },
  { code: "BGN", label: "BGN - Lev bulgaro" },
  { code: "HRK", label: "HRK - Kuna croata" },
  { code: "HUF", label: "HUF - Forinto hungaro" },
  { code: "JPY", label: "JPY - Yen japones" },
  { code: "CNY", label: "CNY - Yuan chino" },
  { code: "MXN", label: "MXN - Peso mexicano" },
  { code: "BRL", label: "BRL - Real brasileno" },
  { code: "ARS", label: "ARS - Peso argentino" },
  { code: "CLP", label: "CLP - Peso chileno" },
  { code: "COP", label: "COP - Peso colombiano" },
] as const;

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  amount?: number;
}

export function CurrencySelector({ value, onChange, amount = 0 }: CurrencySelectorProps) {
  const { data: ratesData, isLoading: ratesLoading } = useCurrencyRates("EUR");

  const rate = value !== "EUR" && ratesData?.rates ? ratesData.rates[value] : null;
  const convertedAmount = rate && amount > 0 ? amount / rate : null;

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm">
        <Coins className="h-3.5 w-3.5 text-muted-foreground" />
        Moneda
      </Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>

      {value !== "EUR" && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          {ratesLoading ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando tipo de cambio...
            </span>
          ) : rate ? (
            <>
              <p>1 EUR = {rate.toFixed(4)} {value}</p>
              {convertedAmount !== null && (
                <p className="font-medium">
                  Equivalente: {formatCurrency(convertedAmount, "EUR")}
                </p>
              )}
            </>
          ) : (
            <p>Tipo de cambio no disponible</p>
          )}
        </div>
      )}
    </div>
  );
}
