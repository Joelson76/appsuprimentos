-- ==========================================
-- SETUP COMPLETO - Cria tabelas + Permissões + RLS
-- ==========================================
-- Execute ESTE script se as tabelas não existem
-- ==========================================

-- PASSO 1: Verificar se as tabelas principais existem
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERIFICANDO TABELAS EXISTENTES';
  RAISE NOTICE '===========================================';

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN
    RAISE NOTICE '✅ Tabela tenants existe';
  ELSE
    RAISE NOTICE '❌ Tabela tenants NÃO existe - execute as migrations primeiro!';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE NOTICE '✅ Tabela profiles existe';
  ELSE
    RAISE NOTICE '❌ Tabela profiles NÃO existe - execute as migrations primeiro!';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisicoes') THEN
    RAISE NOTICE '✅ Tabela requisicoes existe';
  ELSE
    RAISE NOTICE '❌ Tabela requisicoes NÃO existe - execute as migrations primeiro!';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisicao_itens') THEN
    RAISE NOTICE '✅ Tabela requisicao_itens existe';
  ELSE
    RAISE NOTICE '⚠️ Tabela requisicao_itens NÃO existe - será criada agora';
  END IF;

  RAISE NOTICE '===========================================';
END $$;

-- PASSO 2: Criar tabela requisicao_itens se não existir
-- ==========================================

CREATE TABLE IF NOT EXISTS requisicao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  requisicao_id uuid NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
  produto text NOT NULL,
  descricao text,
  quantidade numeric NOT NULL CHECK (quantidade > 0),
  unidade text NOT NULL DEFAULT 'UN',
  observacao text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requisicao_itens_tenant ON requisicao_itens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_requisicao_itens_requisicao ON requisicao_itens(requisicao_id);

-- PASSO 3: PERMISSÕES BÁSICAS
-- ==========================================

-- Service role (admin total)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Postgres (para triggers)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Supabase Auth
GRANT ALL PRIVILEGES ON public.profiles TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON public.tenants TO supabase_auth_admin;

-- Usuários autenticados
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;

-- Apenas dar permissões em tabelas que existem
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisicoes') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicoes TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisicao_itens') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicao_itens TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fornecedores') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
  END IF;
END $$;

-- Acesso às sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- PASSO 4: POLÍTICAS RLS - PROFILES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seu próprio profile" ON profiles;
CREATE POLICY "Usuários podem ver seu próprio profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio profile" ON profiles;
CREATE POLICY "Usuários podem atualizar seu próprio profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- PASSO 5: POLÍTICAS RLS - TENANTS
-- ==========================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver o tenant da sua empresa" ON tenants;
CREATE POLICY "Usuários podem ver o tenant da sua empresa"
  ON tenants FOR SELECT TO authenticated
  USING (id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- PASSO 6: POLÍTICAS RLS - REQUISICOES (se existir)
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisicoes') THEN
    EXECUTE 'ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem ver requisições do seu tenant" ON requisicoes';
    EXECUTE 'CREATE POLICY "Usuários podem ver requisições do seu tenant"
      ON requisicoes FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem criar requisições no seu tenant" ON requisicoes';
    EXECUTE 'CREATE POLICY "Usuários podem criar requisições no seu tenant"
      ON requisicoes FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem atualizar requisições do seu tenant" ON requisicoes';
    EXECUTE 'CREATE POLICY "Usuários podem atualizar requisições do seu tenant"
      ON requisicoes FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    RAISE NOTICE '✅ Políticas RLS criadas para requisicoes';
  END IF;
END $$;

-- PASSO 7: POLÍTICAS RLS - REQUISICAO_ITENS (se existir)
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisicao_itens') THEN
    EXECUTE 'ALTER TABLE requisicao_itens ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem ver itens de requisições do seu tenant" ON requisicao_itens';
    EXECUTE 'CREATE POLICY "Usuários podem ver itens de requisições do seu tenant"
      ON requisicao_itens FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem criar itens no seu tenant" ON requisicao_itens';
    EXECUTE 'CREATE POLICY "Usuários podem criar itens no seu tenant"
      ON requisicao_itens FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem atualizar itens do seu tenant" ON requisicao_itens';
    EXECUTE 'CREATE POLICY "Usuários podem atualizar itens do seu tenant"
      ON requisicao_itens FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem deletar itens do seu tenant" ON requisicao_itens';
    EXECUTE 'CREATE POLICY "Usuários podem deletar itens do seu tenant"
      ON requisicao_itens FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    RAISE NOTICE '✅ Políticas RLS criadas para requisicao_itens';
  END IF;
END $$;

-- PASSO 8: VERIFICAÇÃO FINAL
-- ==========================================

DO $$
DECLARE
  pol_count INTEGER;
  table_count INTEGER;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERIFICAÇÃO FINAL';
  RAISE NOTICE '===========================================';

  -- Contar tabelas
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('tenants', 'profiles', 'requisicoes', 'requisicao_itens');

  RAISE NOTICE 'Total de tabelas principais: %', table_count;

  -- Verificar políticas
  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'profiles';
  RAISE NOTICE '✅ Profiles: % política(s)', pol_count;

  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'tenants';
  RAISE NOTICE '✅ Tenants: % política(s)', pol_count;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisicoes') THEN
    SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'requisicoes';
    RAISE NOTICE '✅ Requisições: % política(s)', pol_count;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisicao_itens') THEN
    SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'requisicao_itens';
    RAISE NOTICE '✅ Itens: % política(s)', pol_count;
  END IF;

  RAISE NOTICE '===========================================';
  RAISE NOTICE '🎉 SETUP COMPLETO!';
  RAISE NOTICE '===========================================';
END $$;
