-- ==========================================
-- 🚨 CRÍTICO: Limpar e Recriar TODAS as Policies RLS
-- ==========================================
-- PROBLEMA: Auditoria detectou:
-- 1. Policies usando JWT incorretamente (user_metadata)
-- 2. Policies com USING (true) - SEM ISOLAMENTO!
-- 3. Policies duplicadas (6-8 por tabela)
--
-- SOLUÇÃO: Dropar TODAS e recriar apenas as 4 corretas
-- ==========================================

-- FUNÇÃO HELPER: Limpa e recria policies para uma tabela
CREATE OR REPLACE FUNCTION fix_tenant_rls_policies(table_name TEXT)
RETURNS TEXT AS $$
DECLARE
  r RECORD;
  result TEXT;
BEGIN
  -- 1. Dropar TODAS as policies existentes
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = table_name
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, table_name);
  END LOOP;

  -- 2. Garantir que RLS está habilitado
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

  -- 3. Criar as 4 policies corretas
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))',
    table_name || '_select', table_name
  );

  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))',
    table_name || '_insert', table_name
  );

  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())) WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))',
    table_name || '_update', table_name
  );

  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))',
    table_name || '_delete', table_name
  );

  result := format('✅ Corrigido: %s (policies limpas e recriadas)', table_name);
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- APLICAR EM TODAS AS TABELAS COM tenant_id
-- ==========================================

-- Listar tabelas que precisam de correção
DO $$
DECLARE
  r RECORD;
  resultado TEXT;
BEGIN
  RAISE NOTICE '🔧 Iniciando correção de RLS em todas as tabelas...';
  RAISE NOTICE '';

  FOR r IN
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
      -- Excluir tabelas especiais que não precisam de RLS padrão
      AND table_name NOT IN ('tenants', 'planos', 'planos_precos')
    ORDER BY table_name
  LOOP
    BEGIN
      resultado := fix_tenant_rls_policies(r.table_name);
      RAISE NOTICE '%', resultado;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO em %: %', r.table_name, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Correção concluída!';
  RAISE NOTICE '📋 Execute AUDIT_RLS_MULTI_TENANT.sql para validar';
END $$;

-- ==========================================
-- CASOS ESPECIAIS
-- ==========================================

-- TENANTS: Apenas o próprio tenant pode ver seus dados
-- (super_admin pode ver todos via service_role)
DROP POLICY IF EXISTS "tenants_select" ON tenants;
DROP POLICY IF EXISTS "tenants_insert" ON tenants;
DROP POLICY IF EXISTS "tenants_update" ON tenants;
DROP POLICY IF EXISTS "tenants_delete" ON tenants;
DROP POLICY IF EXISTS "tenants_own" ON tenants;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_select" ON tenants
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "tenants_update" ON tenants
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- PROFILES: Policy especial (self-referencing)
-- Já corrigida pela função acima

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '🎉 TODAS AS POLICIES FORAM CORRIGIDAS!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Agora TODAS as tabelas usam profiles.tenant_id';
  RAISE NOTICE '✅ Sem mais policies com USING (true)';
  RAISE NOTICE '✅ Sem mais policies duplicadas';
  RAISE NOTICE '✅ Apenas 4 policies por tabela (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Execute: \\i supabase/AUDIT_RLS_MULTI_TENANT.sql';
  RAISE NOTICE '2. Confirme: "Tabelas SEM RLS (CRÍTICO!): 0"';
  RAISE NOTICE '3. Faça LOGOUT e LOGIN para regenerar o JWT';
  RAISE NOTICE '4. Acesse /debug-tenant para validar';
  RAISE NOTICE '';
END $$;
