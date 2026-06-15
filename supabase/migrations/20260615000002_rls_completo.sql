-- ==========================================
-- RLS - HABILITAR EM TODAS AS TABELAS
-- Migration segura que só habilita RLS
-- As policies são criadas na próxima migration
-- ==========================================

-- REGRA DE OURO:
-- Toda tabela com tenant_id DEVE ter RLS habilitado

-- ==========================================
-- FUNÇÃO AUXILIAR: Habilitar RLS se tabela existe
-- ==========================================
CREATE OR REPLACE FUNCTION enable_rls_if_exists(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = table_name
  ) THEN
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    RAISE NOTICE '✅ RLS habilitado em: %', table_name;
  ELSE
    RAISE NOTICE '⚠️ Tabela não existe (ignorando): %', table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ==========================================

-- Tabelas core do SaaS
SELECT enable_rls_if_exists('tenants');
SELECT enable_rls_if_exists('profiles');

-- Tabelas de compras
SELECT enable_rls_if_exists('requisicoes');
SELECT enable_rls_if_exists('cotacoes');
SELECT enable_rls_if_exists('pedidos');
SELECT enable_rls_if_exists('ordens_compra');

-- Tabelas de cadastros
SELECT enable_rls_if_exists('fornecedores');
SELECT enable_rls_if_exists('categorias');
SELECT enable_rls_if_exists('centros_custo');

-- Tabelas de documentos
SELECT enable_rls_if_exists('contratos');
SELECT enable_rls_if_exists('notas_fiscais');

-- Tabelas de estoque (podem não existir ainda)
SELECT enable_rls_if_exists('estoque');
SELECT enable_rls_if_exists('movimentacoes_estoque');

-- Tabelas de aprovação
SELECT enable_rls_if_exists('aprovacoes');

-- Tabelas de billing
SELECT enable_rls_if_exists('assinaturas');
SELECT enable_rls_if_exists('pagamentos');
SELECT enable_rls_if_exists('uso_tenants');

-- Tabelas auxiliares
SELECT enable_rls_if_exists('notificacoes_pendentes');

-- ==========================================
-- PLANOS (já deve ter RLS da migration anterior)
-- ==========================================
SELECT enable_rls_if_exists('planos');

-- ==========================================
-- RELATÓRIO FINAL
-- ==========================================
DO $$
DECLARE
  total_com_rls INTEGER;
  total_com_tenant_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_com_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;

  SELECT COUNT(DISTINCT table_name) INTO total_com_tenant_id
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'tenant_id';

  RAISE NOTICE '================================================';
  RAISE NOTICE 'RELATÓRIO RLS';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total de tabelas com RLS habilitado: %', total_com_rls;
  RAISE NOTICE 'Total de tabelas com tenant_id: %', total_com_tenant_id;
  RAISE NOTICE '================================================';

  IF total_com_tenant_id > 0 AND total_com_rls >= total_com_tenant_id THEN
    RAISE NOTICE '✅ Todas as tabelas com tenant_id têm RLS habilitado!';
  ELSIF total_com_tenant_id > total_com_rls THEN
    RAISE WARNING '⚠️ Algumas tabelas com tenant_id podem não ter RLS';
  END IF;

  RAISE NOTICE 'Próximo passo: Executar migration 20260615000003 para criar policies';
END $$;

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS enable_rls_if_exists(TEXT);

-- ==========================================
-- POLICIES PARA TABELA: tenants
-- ==========================================
DROP POLICY IF EXISTS "tenants_own" ON tenants;
CREATE POLICY "tenants_own" ON tenants
  FOR ALL
  USING (
    id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- ==========================================
-- POLICIES PARA TABELA: profiles
-- ==========================================
DROP POLICY IF EXISTS "profiles_own_tenant" ON profiles;
CREATE POLICY "profiles_own_tenant" ON profiles
  FOR ALL
  USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- ==========================================
-- POLICIES PARA TABELAS DE COMPRAS
-- ==========================================
DROP POLICY IF EXISTS "requisicoes_tenant" ON requisicoes;
CREATE POLICY "requisicoes_tenant" ON requisicoes
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

DROP POLICY IF EXISTS "cotacoes_tenant" ON cotacoes;
CREATE POLICY "cotacoes_tenant" ON cotacoes
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

DROP POLICY IF EXISTS "pedidos_tenant" ON pedidos;
CREATE POLICY "pedidos_tenant" ON pedidos
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

DROP POLICY IF EXISTS "ordens_compra_tenant" ON ordens_compra;
CREATE POLICY "ordens_compra_tenant" ON ordens_compra
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- POLICIES PARA CADASTROS
-- ==========================================
DROP POLICY IF EXISTS "fornecedores_tenant" ON fornecedores;
CREATE POLICY "fornecedores_tenant" ON fornecedores
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

DROP POLICY IF EXISTS "categorias_tenant" ON categorias;
CREATE POLICY "categorias_tenant" ON categorias
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

DROP POLICY IF EXISTS "centros_custo_tenant" ON centros_custo;
CREATE POLICY "centros_custo_tenant" ON centros_custo
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- POLICIES PARA DOCUMENTOS
-- ==========================================
DROP POLICY IF EXISTS "contratos_tenant" ON contratos;
CREATE POLICY "contratos_tenant" ON contratos
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

DROP POLICY IF EXISTS "notas_fiscais_tenant" ON notas_fiscais;
CREATE POLICY "notas_fiscais_tenant" ON notas_fiscais
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- POLICIES PARA ESTOQUE
-- ==========================================
DROP POLICY IF EXISTS "estoque_tenant" ON estoque;
CREATE POLICY "estoque_tenant" ON estoque
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

DROP POLICY IF EXISTS "movimentacoes_estoque_tenant" ON movimentacoes_estoque;
CREATE POLICY "movimentacoes_estoque_tenant" ON movimentacoes_estoque
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- POLICIES PARA APROVAÇÕES
-- ==========================================
DROP POLICY IF EXISTS "aprovacoes_tenant" ON aprovacoes;
CREATE POLICY "aprovacoes_tenant" ON aprovacoes
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- POLICIES PARA BILLING
-- ==========================================
-- Já configuradas anteriormente, mas garantindo
DROP POLICY IF EXISTS "assinaturas_tenant" ON assinaturas;
CREATE POLICY "assinaturas_tenant" ON assinaturas
  FOR ALL
  USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

DROP POLICY IF EXISTS "pagamentos_tenant" ON pagamentos;
CREATE POLICY "pagamentos_tenant" ON pagamentos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assinaturas a
      WHERE a.id = assinatura_id
      AND (
        a.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
        OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
      )
    )
  );

DROP POLICY IF EXISTS "uso_tenants_tenant" ON uso_tenants;
CREATE POLICY "uso_tenants_tenant" ON uso_tenants
  FOR ALL
  USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- ==========================================
-- POLICIES PARA NOTIFICAÇÕES
-- ==========================================
DROP POLICY IF EXISTS "notificacoes_pendentes_tenant" ON notificacoes_pendentes;
CREATE POLICY "notificacoes_pendentes_tenant" ON notificacoes_pendentes
  FOR ALL
  USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- ==========================================
-- POLICY PARA PLANOS (PÚBLICO)
-- ==========================================
-- Já configurada anteriormente
DROP POLICY IF EXISTS "planos_public_read" ON planos;
DROP POLICY IF EXISTS "planos_authenticated_read" ON planos;

CREATE POLICY "planos_public_read" ON planos
  FOR SELECT
  USING (ativo = true);

CREATE POLICY "planos_authenticated_read" ON planos
  FOR SELECT
  TO authenticated
  USING (true);

-- ==========================================
-- ADICIONAR TENANT_ID EM TABELAS FALTANTES
-- ==========================================
-- Se alguma tabela relacionada não tiver tenant_id, adicionar

-- Exemplo: itens de requisição herdam tenant_id da requisição pai
-- (Já deve estar implementado via FK)

-- ==========================================
-- FUNÇÃO: Verificar se usuário tem acesso ao tenant
-- ==========================================
CREATE OR REPLACE FUNCTION auth.has_tenant_access(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    check_tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION auth.has_tenant_access IS 'Verifica se usuário autenticado tem acesso ao tenant especificado';

-- ==========================================
-- TRIGGER: Prevenir alteração de tenant_id
-- ==========================================
CREATE OR REPLACE FUNCTION prevent_tenant_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tenant_id IS NOT NULL AND NEW.tenant_id != OLD.tenant_id THEN
    RAISE EXCEPTION 'Não é permitido alterar tenant_id de um registro existente';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas críticas
DROP TRIGGER IF EXISTS prevent_tenant_change_requisicoes ON requisicoes;
CREATE TRIGGER prevent_tenant_change_requisicoes
  BEFORE UPDATE ON requisicoes
  FOR EACH ROW EXECUTE FUNCTION prevent_tenant_id_change();

DROP TRIGGER IF EXISTS prevent_tenant_change_pedidos ON pedidos;
CREATE TRIGGER prevent_tenant_change_pedidos
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION prevent_tenant_id_change();

DROP TRIGGER IF EXISTS prevent_tenant_change_fornecedores ON fornecedores;
CREATE TRIGGER prevent_tenant_change_fornecedores
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION prevent_tenant_id_change();

-- ==========================================
-- COMENTÁRIOS DE SEGURANÇA
-- ==========================================
COMMENT ON TABLE tenants IS '⚠️ RLS CRÍTICO - Dados do tenant';
COMMENT ON TABLE profiles IS '⚠️ RLS CRÍTICO - Dados de usuários';
COMMENT ON TABLE assinaturas IS '⚠️ RLS CRÍTICO - Dados de pagamento';
COMMENT ON TABLE pagamentos IS '⚠️ RLS CRÍTICO - Dados financeiros';

-- ==========================================
-- VALIDAÇÃO FINAL
-- ==========================================
-- Gerar relatório de tabelas sem RLS
DO $$
DECLARE
  r RECORD;
  sem_rls INTEGER := 0;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables t
    WHERE schemaname = 'public'
      AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys', 'planos')
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.tablename
          AND c.column_name = 'tenant_id'
          AND c.table_schema = 'public'
      )
      AND NOT EXISTS (
        SELECT 1 FROM pg_class cl
        WHERE cl.relname = t.tablename
          AND cl.relrowsecurity = true
      )
  LOOP
    RAISE WARNING 'Tabela sem RLS: %', r.tablename;
    sem_rls := sem_rls + 1;
  END LOOP;

  IF sem_rls > 0 THEN
    RAISE WARNING '⚠️ Total de tabelas sem RLS: %', sem_rls;
  ELSE
    RAISE NOTICE '✅ Todas as tabelas com tenant_id têm RLS habilitado';
  END IF;
END $$;
