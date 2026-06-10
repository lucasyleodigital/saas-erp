import { Injectable, applyDecorators, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth } from "@nestjs/swagger";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

export function JwtAuth() {
  return applyDecorators(ApiBearerAuth(), UseGuards(JwtAuthGuard));
}
