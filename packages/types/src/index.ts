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
  // -1 = unlimited
  maxUsers: number;
  maxEmployees: number;
  maxClients: number;
  maxInvoicesPerMonth: number;
  maxQuotesPerMonth: number;
  maxProducts: number;
  maxAutomations: number;
  // Feature flags
  canSendEmails: boolean;
  hasAccounting: boolean;        // libro diario, IVA, 303/130, cuenta de resultados
  hasFullAccounting: boolean;    // 347, 111/190, 202, retenciones, libros oficiales
  hasVeriFactu: boolean;
  hasApiAccess: boolean;
  hasPayroll: boolean;           // nóminas, SEPA, portal del empleado
  hasExpenseClaims: boolean;     // notas de gasto, kilometraje, dietas
  hasExpenseAdvanced: boolean;   // tickets por email y conciliación de tarjetas
  hasFleet: boolean;             // flota de vehículos y DeCA
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    maxUsers: 1,
    maxEmployees: 0,
    maxClients: 5,
    maxInvoicesPerMonth: 10,
    maxQuotesPerMonth: 5,
    maxProducts: 50,
    maxAutomations: 0,
    canSendEmails: false,
    hasAccounting: false,
    hasFullAccounting: false,
    hasVeriFactu: true,
    hasApiAccess: false,
    hasPayroll: false,
    hasExpenseClaims: false,
    hasExpenseAdvanced: false,
    hasFleet: false,
  },
  STARTER: {
    maxUsers: 3,
    maxEmployees: 3,
    maxClients: -1,
    maxInvoicesPerMonth: -1,
    maxQuotesPerMonth: -1,
    maxProducts: -1,
    maxAutomations: 3,
    canSendEmails: true,
    hasAccounting: true,
    hasFullAccounting: false,
    hasVeriFactu: true,
    hasApiAccess: false,
    hasPayroll: false,
    hasExpenseClaims: true,
    hasExpenseAdvanced: false,
    hasFleet: false,
  },
  PRO: {
    maxUsers: 10,
    maxEmployees: 10,
    maxClients: -1,
    maxInvoicesPerMonth: -1,
    maxQuotesPerMonth: -1,
    maxProducts: -1,
    maxAutomations: -1,
    canSendEmails: true,
    hasAccounting: true,
    hasFullAccounting: true,
    hasVeriFactu: true,
    hasApiAccess: true,
    hasPayroll: true,
    hasExpenseClaims: true,
    hasExpenseAdvanced: true,
    hasFleet: true,
  },
  ENTERPRISE: {
    maxUsers: -1,
    maxEmployees: -1,
    maxClients: -1,
    maxInvoicesPerMonth: -1,
    maxQuotesPerMonth: -1,
    maxProducts: -1,
    maxAutomations: -1,
    canSendEmails: true,
    hasAccounting: true,
    hasFullAccounting: true,
    hasVeriFactu: true,
    hasApiAccess: true,
    hasPayroll: true,
    hasExpenseClaims: true,
    hasExpenseAdvanced: true,
    hasFleet: true,
  },
};

export const PLAN_PRICES: Record<PlanType, { monthly: number; annual: number; name: string; description: string }> = {
  FREE: { monthly: 0, annual: 0, name: "Gratis", description: "Para probar el ERP" },
  STARTER: { monthly: 29, annual: 24, name: "Starter", description: "Para pequeñas empresas" },
  PRO: { monthly: 79, annual: 66, name: "Pro", description: "Para empresas en crecimiento" },
  ENTERPRISE: { monthly: 199, annual: 166, name: "Enterprise", description: "Para grandes empresas" },
};
