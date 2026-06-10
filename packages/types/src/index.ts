// ============================================================
// AUTH
// ============================================================

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: UserRole;
  companyId: string;
  companyName: string;
}

// ============================================================
// ENUMS (mirror of Prisma enums for use in frontend)
// ============================================================

export type UserRole =
  | "SUPER_ADMIN"
  | "OWNER"
  | "ADMIN"
  | "ACCOUNTANT"
  | "SALES"
  | "EMPLOYEE";

export type PlanType = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PAID"
  | "PARTIAL"
  | "OVERDUE"
  | "CANCELLED";

export type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export type DealStage =
  | "LEAD"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export type ActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "NOTE"
  | "TASK"
  | "WHATSAPP";

export type ProductType = "SERVICE" | "DIGITAL" | "PHYSICAL";

export type VerifactuStatus =
  | "GENERATED"
  | "SIGNED"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED";

// ============================================================
// API RESPONSE WRAPPERS
// ============================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// ============================================================
// COMMON QUERY PARAMS
// ============================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  pendingInvoices: number;
  pendingAmount: number;
  activeClients: number;
  clientsChange: number;
  openDeals: number;
  openDealsValue: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  expenses: number;
}

// ============================================================
// VERIFACTU SPECIFIC
// ============================================================

export interface VerifactuInvoiceData {
  invoiceId: string;
  series: string;
  number: string;
  issueDate: string;
  sellerNif: string;
  sellerName: string;
  buyerNif?: string;
  buyerName: string;
  totalAmount: number;
  taxBreakdown: Array<{
    rate: number;
    base: number;
    amount: number;
  }>;
}

// ============================================================
// SUBSCRIPTION / PLANS
// ============================================================

export interface PlanLimits {
  clients: number;
  invoicesPerMonth: number;
  users: number;
  storage: number; // GB
  verifactu: boolean;
  ai: boolean;
  api: boolean;
  customDomain: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    clients: 5,
    invoicesPerMonth: 10,
    users: 1,
    storage: 1,
    verifactu: false,
    ai: false,
    api: false,
    customDomain: false,
  },
  STARTER: {
    clients: 50,
    invoicesPerMonth: 100,
    users: 3,
    storage: 10,
    verifactu: true,
    ai: false,
    api: false,
    customDomain: false,
  },
  PRO: {
    clients: 500,
    invoicesPerMonth: 1000,
    users: 10,
    storage: 50,
    verifactu: true,
    ai: true,
    api: true,
    customDomain: false,
  },
  ENTERPRISE: {
    clients: -1,
    invoicesPerMonth: -1,
    users: -1,
    storage: 200,
    verifactu: true,
    ai: true,
    api: true,
    customDomain: true,
  },
};
