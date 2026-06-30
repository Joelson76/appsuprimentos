-- ==========================================
-- FUNÇÃO HELPER: Criar Policies Multi-Tenant Automaticamente
-- ==========================================
-- Esta função cria automaticamente as 4 policies de isolamento
-- para qualquer tabela com tenant_id
-- ==========================================

CREATE OR REPLACE FUNCTION create_tenant_policies(table_name TEXT)
RETURNS TEXT AS $$
DECLARE
  sql_enable_rls TEXT;
  sql_drop_select TEXT;
  sql_drop_insert TEXT;
  sql_drop_update TEXT;
  sql_drop_delete TEXT;
  sql_select TEXT;
  sql_insert TEXT;
  sql_update TEXT;
  sql_delete TEXT;
  result TEXT;
BEGIN
  -- Validar que a tabela existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = $1
  ) THEN
    RAISE EXCEPTION 'Tabela % não existe no schema public', table_name;
  END IF;

  -- Validar que a tabela tem coluna tenant_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'tenant_id'
  ) THEN
    RAISE EXCEPTION 'Tabela % não possui coluna tenant_id', table_name;
  END IF;

  -- 1. Habilitar RLS
  sql_enable_rls := format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  EXECUTE sql_enable_rls;

  -- 2. Dropar policies antigas (se existirem)
  sql_drop_select := format('DROP POLICY IF EXISTS %I ON %I', table_name || '_select', table_name);
  sql_drop_insert := format('DROP POLICY IF EXISTS %I ON %I', table_name || '_insert', table_name);
  sql_drop_update := format('DROP POLICY IF EXISTS %I ON %I', table_name || '_update', table_name);
  sql_drop_delete := format('DROP POLICY IF EXISTS %I ON %I', table_name || '_delete', table_name);

  EXECUTE sql_drop_select;
  EXECUTE sql_drop_insert;
  EXECUTE sql_drop_update;
  EXECUTE sql_drop_delete;

  -- 3. Criar policy SELECT
  sql_select := format(
    'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))',
    table_name || '_select',
    table_name
  );
  EXECUTE sql_select;

  -- 4. Criar policy INSERT
  sql_insert := format(
    'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))',
    table_name || '_insert',
    table_name
  );
  EXECUTE sql_insert;

  -- 5. Criar policy UPDATE
  sql_update := format(
    'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())) WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))',
    table_name || '_update',
    table_name
  );
  EXECUTE sql_update;

  -- 6. Criar policy DELETE
  sql_delete := format(
    'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))',
    table_name || '_delete',
    table_name
  );
  EXECUTE sql_delete;

  result := format('✅ RLS e 4 policies criadas com sucesso para a tabela: %s', table_name);
  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Erro ao criar policies para %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário na função
COMMENT ON FUNCTION create_tenant_policies(TEXT) IS
'Cria automaticamente RLS e as 4 policies (SELECT, INSERT, UPDATE, DELETE) para isolamento multi-tenant.
Uso: SELECT create_tenant_policies(''nome_da_tabela'');';

-- ==========================================
-- EXEMPLO DE USO
-- ==========================================
/*
-- Para aplicar RLS + policies em uma tabela existente:
SELECT create_tenant_policies('produtos');

-- Para aplicar em múltiplas tabelas de uma vez:
SELECT create_tenant_policies('produtos');
SELECT create_tenant_policies('fornecedores');
SELECT create_tenant_policies('requisicoes');

-- Verificar resultado:
SELECT * FROM pg_policies WHERE tablename = 'produtos';
*/

-- ==========================================
-- FUNÇÃO AUXILIAR: Aplicar em TODAS as tabelas com tenant_id
-- ==========================================
CREATE OR REPLACE FUNCTION apply_tenant_policies_to_all()
RETURNS TABLE (tabela TEXT, resultado TEXT) AS $$
DECLARE
  r RECORD;
  resultado_atual TEXT;
BEGIN
  FOR r IN
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
    ORDER BY table_name
  LOOP
    BEGIN
      resultado_atual := create_tenant_policies(r.table_name);
      tabela := r.table_name;
      resultado := resultado_atual;
      RETURN NEXT;
    EXCEPTION
      WHEN OTHERS THEN
        tabela := r.table_name;
        resultado := format('❌ ERRO: %s', SQLERRM);
        RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION apply_tenant_policies_to_all() IS
'Aplica RLS e policies em TODAS as tabelas que possuem coluna tenant_id.
Uso: SELECT * FROM apply_tenant_policies_to_all();';

-- ==========================================
-- TESTE RÁPIDO
-- ==========================================
/*
-- 1. Listar tabelas que precisam de policies:
SELECT DISTINCT table_name
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'tenant_id'
ORDER BY table_name;

-- 2. Aplicar em todas de uma vez:
SELECT * FROM apply_tenant_policies_to_all();

-- 3. Auditar resultado:
\i AUDIT_RLS_MULTI_TENANT.sql
*/
