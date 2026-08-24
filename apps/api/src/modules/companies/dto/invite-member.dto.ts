import { IsEmail, IsIn, MaxLength } from "class-validator";

// SUPER_ADMIN is intentionally excluded — it's only auto-granted via
// PLATFORM_ADMIN_EMAILS, never assignable through this endpoint.
export const ASSIGNABLE_ROLES = ["OWNER", "ADMIN", "ACCOUNTANT", "SALES", "EMPLOYEE"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export class InviteMemberDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsIn(ASSIGNABLE_ROLES)
  role!: AssignableRole;
}
