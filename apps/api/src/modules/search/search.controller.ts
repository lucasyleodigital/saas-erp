import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Search")
@UseGuards(JwtAuthGuard)
@Controller("search")
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(@CurrentUser() user: JwtPayload, @Query("q") q: string) {
    return this.searchService.search(user.companyId, q ?? "");
  }
}
