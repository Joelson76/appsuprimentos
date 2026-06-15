-- ==========================================
-- RLS POLICIES - VERSÃO SEGURA
-- Cria policies apenas se a tabela existir
-- ==========================================

-- Função auxiliar para criar policy se tabela existe
CREATE OR REPLACE FUNCTION create_policy_if_table_exists(
  table_name TEXT,
  policy_name TEXT,
  policy_definition TEXT
)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = table_name
  ) THEN
    -- Dropar policy antiga se existir
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);

    -- Criar nova policy
    EXECUTE format('CREATE POLICY %I ON %I %s', policy_name, table_name, policy_definition);

    RAISE NOTICE 'Policy criada: % em %', policy_name, table_name;
  ELSE
    RAISE NOTICE 'Tabela não existe (ignorando policy): %', table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- POLICIES PARA TABELAS EXISTENTES
-- ==========================================

-- Tenants
SELECT create_policy_if_table_exists(
  'tenants',
  'tenants_own',
  $$FOR ALL USING (
    id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  )$$
);

-- Profiles
SELECT create_policy_if_table_exists(
  'profiles',
  'profiles_own_tenant',
  $$FOR ALL USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  )$$
);

-- Requisições
SELECT create_policy_if_table_exists(
  'requisicoes',
  'requisicoes_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Cotações
SELECT create_policy_if_table_exists(
  'cotacoes',
  'cotacoes_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Pedidos
SELECT create_policy_if_table_exists(
  'pedidos',
  'pedidos_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Ordens de Compra
SELECT create_policy_if_table_exists(
  'ordens_compra',
  'ordens_compra_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Fornecedores
SELECT create_policy_if_table_exists(
  'fornecedores',
  'fornecedores_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Categorias
SELECT create_policy_if_table_exists(
  'categorias',
  'categorias_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Centros de Custo
SELECT create_policy_if_table_exists(
  'centros_custo',
  'centros_custo_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Contratos
SELECT create_policy_if_table_exists(
  'contratos',
  'contratos_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Notas Fiscais
SELECT create_policy_if_table_exists(
  'notas_fiscais',
  'notas_fiscais_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Estoque (se existir)
SELECT create_policy_if_table_exists(
  'estoque',
  'estoque_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Movimentações de Estoque (se existir)
SELECT create_policy_if_table_exists(
  'movimentacoes_estoque',
  'movimentacoes_estoque_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Aprovações
SELECT create_policy_if_table_exists(
  'aprovacoes',
  'aprovacoes_tenant',
  $$FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))$$
);

-- Assinaturas
SELECT create_policy_if_table_exists(
  'assinaturas',
  'assinaturas_tenant',
  $$FOR ALL USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  )$$
);

-- Pagamentos
SELECT create_policy_if_table_exists(
  'pagamentos',
  'pagamentos_tenant',
  $$FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assinaturas a
      WHERE a.id = assinatura_id
      AND (
        a.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
        OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
      )
    )
  )$$
);

-- Uso de Tenants
SELECT create_policy_if_table_exists(
  'uso_tenants',
  'uso_tenants_tenant',
  $$FOR ALL USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  )$$
);

-- Notificações Pendentes
SELECT create_policy_if_table_exists(
  'notificacoes_pendentes',
  'notificacoes_pendentes_tenant',
  $$FOR ALL USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  )$$
);

-- Planos (leitura pública)
SELECT create_policy_if_table_exists(
  'planos',
  'planos_public_read',
  $$FOR SELECT USING (ativo = true)$$
);

SELECT create_policy_if_table_exists(
  'planos',
  'planos_authenticated_read',
  $$FOR SELECT TO authenticated USING (true)$$
);

-- ==========================================
-- FUNÇÃO: Verificar acesso ao tenant
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

COMMENT ON FUNCTION auth.has_tenant_access IS 'Verifica se usuário autenticado tem acesso ao tenant';

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

-- Aplicar trigger apenas em tabelas que existem
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'requisicoes',
    'pedidos',
    'fornecedores',
    'contratos',
    'notas_fiscais'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('
        DROP TRIGGER IF EXISTS prevent_tenant_change_%s ON %I;
        CREATE TRIGGER prevent_tenant_change_%s
          BEFORE UPDATE ON %I
          FOR EACH ROW EXECUTE FUNCTION prevent_tenant_id_change();
      ', tbl, tbl, tbl, tbl);

      RAISE NOTICE 'Trigger de proteção criado em: %', tbl;
    END IF;
  END LOOP;
END $$;

-- ==========================================
-- VALIDAÇÃO FINAL
-- ==========================================
DO $$
DECLARE
  r RECORD;
  sem_rls INTEGER := 0;
  com_rls INTEGER := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'RELATÓRIO DE SEGURANÇA RLS';
  RAISE NOTICE '================================================';

  FOR r IN
    SELECT
      t.tablename,
      c.relrowsecurity as tem_rls,
      COUNT(p.policyname) as num_policies
    FROM pg_tables t
    LEFT JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
    WHERE t.schemaname = 'public'
      AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
      AND EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_name = t.tablename
          AND col.column_name = 'tenant_id'
          AND col.table_schema = 'public'
      )
    GROUP BY t.tablename, c.relrowsecurity
    ORDER BY t.tablename
  LOOP
    IF r.tem_rls THEN
      RAISE NOTICE '✅ % - RLS ATIVO (% policies)', r.tablename, r.num_policies;
      com_rls := com_rls + 1;
    ELSE
      RAISE WARNING '❌ % - RLS DESABILITADO', r.tablename;
      sem_rls := sem_rls + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total com RLS: %', com_rls;
  RAISE NOTICE 'Total sem RLS: %', sem_rls;

  IF sem_rls > 0 THEN
    RAISE WARNING '⚠️ ATENÇÃO: % tabelas sem RLS!', sem_rls;
  ELSE
    RAISE NOTICE '✅ Todas as tabelas com tenant_id têm RLS!';
  END IF;

  RAISE NOTICE '================================================';
END $$;

-- Limpar funções auxiliares
DROP FUNCTION IF EXISTS enable_rls_if_exists(TEXT);
DROP FUNCTION IF EXISTS create_policy_if_table_exists(TEXT, TEXT, TEXT);
