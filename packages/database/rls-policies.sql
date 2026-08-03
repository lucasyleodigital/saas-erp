-- ============================================================
-- ROW LEVEL SECURITY (RLS) for YouWhole SaaS ERP
-- ============================================================
-- Defense-in-depth: even if application code has a bug,
-- the database itself prevents cross-tenant data access.
--
-- How it works:
-- 1. Before each request, the API sets: SET LOCAL app.current_company_id = '<uuid>'
-- 2. RLS policies check: companyId = current_setting('app.current_company_id')
-- 3. If the setting is missing, NO rows are returned (fail-closed)
--
-- Run this ONCE against your Supabase/PostgreSQL database.
-- ============================================================

-- Helper function: returns the current tenant ID or empty string (fail-closed)
CREATE OR REPLACE FUNCTION current_company_id() RETURNS TEXT AS $$
BEGIN
  RETURN coalesce(current_setting('app.current_company_id', true), '');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Revoke direct execution from public roles (only the API backend calls this via RLS)
REVOKE EXECUTE ON FUNCTION current_company_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION current_company_id() FROM anon;
REVOKE EXECUTE ON FUNCTION current_company_id() FROM authenticated;

-- ============================================================
-- TABLES WITH companyId (direct tenant column)
-- ============================================================

-- All tenant-scoped tables and their real PostgreSQL names
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'clients',
    'leads',
    'pipelines',
    'deals',
    'activities',
    'products',
    'categories',
    'taxes',
    'invoice_series',
    'invoices',
    'quotes',
    'verifactu_records',
    'delivery_notes',
    'accounts',
    'journal_entries',
    'bank_accounts',
    'warehouses',
    'suppliers',
    'notifications',
    'audit_logs',
    'employees',
    'time_entries',
    'leave_requests',
    'payrolls',
    'automations',
    'automation_logs',
    'projects',
    'custom_fields',
    'orders',
    'purchase_orders',
    'tags',
    'meetings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- Force RLS even for table owner (Prisma connects as owner)
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

    -- Drop existing policy if any
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);

    -- Create policy: SELECT/INSERT/UPDATE/DELETE only for matching companyId
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
       FOR ALL
       USING ("companyId" = current_company_id())
       WITH CHECK ("companyId" = current_company_id())',
      tbl
    );

    RAISE NOTICE 'RLS enabled on: %', tbl;
  END LOOP;
END $$;

-- ============================================================
-- TABLES WITHOUT companyId (system tables, cross-tenant)
-- These do NOT get RLS because they are either:
-- - System tables (users, companies, refresh_tokens)
-- - Join tables scoped through parent (invoice_items, quote_items, etc.)
-- ============================================================

-- shift_assignments: uses snake_case column (company_id), handled separately below
ALTER TABLE IF EXISTS shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shift_assignments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON shift_assignments;
CREATE POLICY tenant_isolation ON shift_assignments
  FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- invoice_items: scoped through invoice.companyId (FK cascade)
-- invoice_taxes: scoped through invoice.companyId (FK cascade)
-- quote_items: scoped through quote.companyId (FK cascade)
-- delivery_note_items: scoped through delivery_note.companyId (FK cascade)
-- order_items: scoped through order.companyId (FK cascade)
-- purchase_order_items: scoped through purchase_order.companyId (FK cascade)
-- journal_items: scoped through journal_entry.companyId (FK cascade)
-- contacts: scoped through client.companyId (FK cascade)
-- client_tags: scoped through client + tag (FK cascade)
-- users: cross-tenant (a user can belong to multiple companies)
-- companies: each company sees only itself (handled by auth)
-- user_companies: join table (handled by auth)
-- refresh_tokens: system table (handled by auth)
-- invitations: system table (handled by auth)

-- ============================================================
-- VERIFICATION
-- ============================================================
-- After running, verify with:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND rowsecurity = true;
--
-- To test: try querying without setting the variable:
--   SELECT * FROM invoices; -- should return 0 rows
--   SET LOCAL app.current_company_id = 'your-company-uuid';
--   SELECT * FROM invoices; -- should return only that company's invoices
