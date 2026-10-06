import { IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class Complete2FALoginDto {
  @ApiProperty()
  @IsString()
  pendingToken!: string;

  @ApiProperty()
  @IsString()
  @Length(6, 6)
  code!: string;
}
