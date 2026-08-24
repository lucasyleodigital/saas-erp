import { IsIn } from "class-validator";
import { ASSIGNABLE_ROLES, type AssignableRole } from "./invite-member.dto";

export class UpdateMemberRoleDto {
  @IsIn(ASSIGNABLE_ROLES)
  role!: AssignableRole;
}
