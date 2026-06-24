/**
 * Tenant isolation logging for Prisma queries.
 *
 * In Prisma 6+, $use() middleware is removed. Instead, we rely on:
 * 1. PostgreSQL RLS policies (database level - see rls-policies.sql)
 * 2. The TenantInterceptor (application level - sets session variable)
 * 3. Service-level companyId filtering (code convention)
 *
 * This module exports the list of tenant-scoped models
 * for reference by other security modules.
 */

export const TENANT_MODELS = new Set([
  "Client",
  "Invoice",
  "Product",
  "Quote",
  "DeliveryNote",
  "Lead",
  "Deal",
  "Project",
  "Employee",
  "Payroll",
  "TimeEntry",
  "BankAccount",
  "BankTransaction",
  "Supplier",
  "Order",
  "PurchaseOrder",
  "Automation",
  "AutomationLog",
  "Notification",
  "CustomField",
  "CustomFieldValue",
  "InvoiceSeries",
  "Tax",
  "Tag",
  "Webhook",
  "InventoryItem",
  "Warehouse",
  "InventoryMovement",
  "Pipeline",
  "PipelineStage",
  "Expense",
  "AccountingAccount",
  "JournalEntry",
]);
