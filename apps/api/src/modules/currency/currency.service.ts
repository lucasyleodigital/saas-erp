import { Injectable } from "@nestjs/common";

@Injectable()
export class CurrencyService {
  private cache: {
    rates: Record<string, number>;
    fetchedAt: number;
  } | null = null;

  async getRates(
    base: string = "EUR",
  ): Promise<Record<string, number>> {
    if (this.cache && Date.now() - this.cache.fetchedAt < 3600000) {
      return this.cache.rates;
    }

    try {
      const res = await fetch(
        "https://api.frankfurter.app/latest?from=" + base,
      );
      const data = await res.json();
      this.cache = {
        rates: { [base]: 1, ...data.rates },
        fetchedAt: Date.now(),
      };
      return this.cache.rates;
    } catch {
      return { EUR: 1, USD: 1.08, GBP: 0.86 };
    }
  }

  async convert(
    amount: number,
    from: string,
    to: string,
  ): Promise<{ amount: number; rate: number }> {
    const rates = await this.getRates("EUR");
    const fromRate = rates[from] ?? 1;
    const toRate = rates[to] ?? 1;
    const rate = toRate / fromRate;
    return {
      amount: Math.round(amount * rate * 100) / 100,
      rate: Math.round(rate * 1000000) / 1000000,
    };
  }
}
