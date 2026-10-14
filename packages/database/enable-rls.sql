-- ============================================================
-- Activa RLS en toda tabla del esquema public que no lo tenga.
-- ============================================================
-- Se ejecuta en cada arranque (start.sh) después de `prisma db push`,
-- porque db push crea las tablas nuevas sin RLS y Supabase las expone
-- por su API REST (PostgREST) a cualquiera con la clave anon.
--
-- La API se conecta como `postgres` (BYPASSRLS), así que sin políticas
-- el backend sigue leyendo y escribiendo con normalidad y los roles
-- anon/authenticated de Supabase no ven ninguna fila.
-- Las políticas por empresa siguen en rls-policies.sql.
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
    RAISE NOTICE 'RLS activado en: %', r.relname;
  END LOOP;
END $$;
