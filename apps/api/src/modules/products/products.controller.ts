import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import type { JwtPayload } from "@saas/types";

@ApiTags("Products")
@UseGuards(JwtAuthGuard)
@Controller("products")
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() params: any) {
    return this.productsService.findAll(user.companyId, params);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.productsService.findOne(user.companyId, id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateProductDto) {
    return this.productsService.create(user.companyId, body);
  }

  @Put(":id")
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(user.companyId, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.productsService.remove(user.companyId, id);
  }
}
