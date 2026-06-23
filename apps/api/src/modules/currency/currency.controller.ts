import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CurrencyService } from "./currency.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Currency")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("currency")
export class CurrencyController {
  constructor(private currencyService: CurrencyService) {}

  @Get("rates")
  getRates(@Query("base") base?: string) {
    return this.currencyService.getRates(base || "EUR");
  }

  @Get("convert")
  convert(
    @Query("amount") amount: string,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.currencyService.convert(Number(amount), from, to);
  }
}
