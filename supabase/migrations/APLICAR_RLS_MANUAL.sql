-- ==========================================
-- RLS MANUAL - APLICAR APENAS TABELAS QUE EXISTEM
-- Cole este SQL no Supabase SQL Editor
-- ==========================================

-- ==========================================
-- 1. HABILITAR RLS NAS TABELAS EXISTENTES
-- ==========================================

-- Core
ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Compras
ALTER TABLE IF EXISTS requisicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ordens_compra ENABLE ROW LEVEL SECURITY;

-- Cadastros
ALTER TABLE IF EXISTS fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS centros_custo ENABLE ROW LEVEL SECURITY;

-- Documentos
ALTER TABLE IF EXISTS contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Aprovações
ALTER TABLE IF EXISTS aprovacoes ENABLE ROW LEVEL SECURITY;

-- Billing
ALTER TABLE IF EXISTS assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uso_tenants ENABLE ROW LEVEL SECURITY;

-- Auxiliares
ALTER TABLE IF EXISTS notificacoes_pendentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planos ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. CRIAR POLICIES NAS TABELAS EXISTENTES
-- ==========================================

-- Tenants
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tenants') THEN
    DROP POLICY IF EXISTS "tenants_own" ON tenants;
    CREATE POLICY "tenants_own" ON tenants
      FOR ALL USING (
        id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
        OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
      );
    RAISE NOTICE '✅ Policy criada: tenants';
  END IF;
END $$;

-- Profiles
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
    DROP POLICY IF EXISTS "profiles_own_tenant" ON profiles;
    CREATE POLICY "profiles_own_tenant" ON profiles
      FOR ALL USING (
        tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
        OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
      );
    RAISE NOTICE '✅ Policy criada: profiles';
  END IF;
END $$;

-- Requisições
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'requisicoes') THEN
    DROP POLICY IF EXISTS "requisicoes_tenant" ON requisicoes;
    CREATE POLICY "requisicoes_tenant" ON requisicoes
      FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: requisicoes';
  END IF;
END $$;

-- Cotações
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'cotacoes') THEN
    DROP POLICY IF EXISTS "cotacoes_tenant" ON cotacoes;
    CREATE POLICY "cotacoes_tenant" ON cotacoes
      FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: cotacoes';
  END IF;
END $$;

-- Pedidos
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'pedidos') THEN
    DROP POLICY IF EXISTS "pedidos_tenant" ON pedidos;
    CREATE POLICY "pedidos_tenant" ON pedidos
      FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: pedidos';
  END IF;
END $$;

-- Ordens de Compra
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ordens_compra') THEN
    DROP POLICY IF EXISTS "ordens_compra_tenant" ON ordens_compra;
    CREATE POLICY "ordens_compra_tenant" ON ordens_compra
      FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: ordens_compra';
  END IF;
END $$;

-- Fornecedores
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'fornecedores') THEN
    DROP POLICY IF EXISTS "fornecedores_tenant" ON fornecedores;
    CREATE POLICY "fornecedores_tenant" ON fornecedores
      FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: fornecedores';
  END IF;
END $$;

-- Categorias
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'categorias') THEN
    DROP POLICY IF EXISTS "categorias_tenant" ON categorias;
    CREATE POLICY "categorias_tenant" ON categorias
      FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: categorias';
  END IF;
END $$;

-- Centros de Custo
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'centros_custo') THEN
    DROP POLICY IF EXISTS "centros_custo_tenant" ON centros_custo;
    CREATE POLICY "centros_custo_tenant" ON centros_custo
      FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: centros_custo';
  END IF;
END $$;

-- Contratos
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'contratos') THEN
    DROP POLICY IF EXISTS "contratos_tenant" ON contratos;
    CREATE POLICY "contratos_tenant" ON contratos
      FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: contratos';
  END IF;
END $$;

-- Notas Fiscais
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notas_fiscais') THEN
    DROP POLICY IF EXISTS "notas_fiscais_tenant" ON notas_fiscais;
    CREATE POLICY "notas_fiscais_tenant" ON notas_fiscais
      FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: notas_fiscais';
  END IF;
END $$;

-- Aprovações
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'aprovacoes') THEN
    DROP POLICY IF EXISTS "aprovacoes_tenant" ON aprovacoes;
    CREATE POLICY "aprovacoes_tenant" ON aprovacoes
      FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: aprovacoes';
  END IF;
END $$;

-- Assinaturas
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'assinaturas') THEN
    DROP POLICY IF EXISTS "assinaturas_tenant" ON assinaturas;
    CREATE POLICY "assinaturas_tenant" ON assinaturas
      FOR ALL USING (
        tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
        OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
      );
    RAISE NOTICE '✅ Policy criada: assinaturas';
  END IF;
END $$;

-- Pagamentos
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'pagamentos') THEN
    DROP POLICY IF EXISTS "pagamentos_tenant" ON pagamentos;
    CREATE POLICY "pagamentos_tenant" ON pagamentos
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM assinaturas a
          WHERE a.id = assinatura_id
          AND (
            a.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
            OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
          )
        )
      );
    RAISE NOTICE '✅ Policy criada: pagamentos';
  END IF;
END $$;

-- Uso Tenants
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'uso_tenants') THEN
    DROP POLICY IF EXISTS "uso_tenants_tenant" ON uso_tenants;
    CREATE POLICY "uso_tenants_tenant" ON uso_tenants
      FOR ALL USING (
        tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
        OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
      );
    RAISE NOTICE '✅ Policy criada: uso_tenants';
  END IF;
END $$;

-- Notificações Pendentes
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notificacoes_pendentes') THEN
    DROP POLICY IF EXISTS "notificacoes_pendentes_tenant" ON notificacoes_pendentes;
    CREATE POLICY "notificacoes_pendentes_tenant" ON notificacoes_pendentes
      FOR ALL USING (
        tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
        OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
      );
    RAISE NOTICE '✅ Policy criada: notificacoes_pendentes';
  END IF;
END $$;

-- Planos (leitura pública)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'planos') THEN
    DROP POLICY IF EXISTS "planos_public_read" ON planos;
    DROP POLICY IF EXISTS "planos_authenticated_read" ON planos;

    CREATE POLICY "planos_public_read" ON planos
      FOR SELECT USING (ativo = true);

    CREATE POLICY "planos_authenticated_read" ON planos
      FOR SELECT TO authenticated USING (true);

    RAISE NOTICE '✅ Policies criadas: planos';
  END IF;
END $$;

-- ==========================================
-- 3. TRIGGER ANTI-ALTERAÇÃO DE TENANT_ID
-- ==========================================

CREATE OR REPLACE FUNCTION prevent_tenant_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tenant_id IS NOT NULL AND NEW.tenant_id != OLD.tenant_id THEN
    RAISE EXCEPTION 'Não é permitido alterar tenant_id de um registro';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em tabelas críticas
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'requisicoes') THEN
    DROP TRIGGER IF EXISTS prevent_tenant_change ON requisicoes;
    CREATE TRIGGER prevent_tenant_change
      BEFORE UPDATE ON requisicoes
      FOR EACH ROW EXECUTE FUNCTION prevent_tenant_id_change();
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'pedidos') THEN
    DROP TRIGGER IF EXISTS prevent_tenant_change ON pedidos;
    CREATE TRIGGER prevent_tenant_change
      BEFORE UPDATE ON pedidos
      FOR EACH ROW EXECUTE FUNCTION prevent_tenant_id_change();
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'fornecedores') THEN
    DROP TRIGGER IF EXISTS prevent_tenant_change ON fornecedores;
    CREATE TRIGGER prevent_tenant_change
      BEFORE UPDATE ON fornecedores
      FOR EACH ROW EXECUTE FUNCTION prevent_tenant_id_change();
  END IF;
END $$;

-- ==========================================
-- 4. RELATÓRIO FINAL
-- ==========================================

DO $$
DECLARE
  r RECORD;
  com_rls INTEGER := 0;
  sem_rls INTEGER := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '          RELATÓRIO DE SEGURANÇA RLS            ';
  RAISE NOTICE '================================================';

  FOR r IN
    SELECT
      t.tablename,
      c.relrowsecurity as tem_rls,
      COUNT(p.policyname) as num_policies
    FROM pg_tables t
    LEFT JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_policies p ON p.tablename = t.tablename
    WHERE t.schemaname = 'public'
      AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
      AND EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_name = t.tablename
          AND col.column_name = 'tenant_id'
      )
    GROUP BY t.tablename, c.relrowsecurity
    ORDER BY t.tablename
  LOOP
    IF r.tem_rls THEN
      RAISE NOTICE '✅ % - RLS ativo (% policies)', r.tablename, r.num_policies;
      com_rls := com_rls + 1;
    ELSE
      RAISE WARNING '❌ % - RLS DESABILITADO!', r.tablename;
      sem_rls := sem_rls + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Tabelas com RLS: %', com_rls;
  RAISE NOTICE 'Tabelas sem RLS: %', sem_rls;
  RAISE NOTICE '================================================';

  IF sem_rls = 0 THEN
    RAISE NOTICE '✅ SUCESSO! Todas as tabelas estão protegidas!';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO: % tabelas sem RLS!', sem_rls;
  END IF;
END $$;
