-- ==========================================
-- FIX PERMISSÕES SEGURO
-- ==========================================
-- SÓ adiciona permissões em tabelas QUE EXISTEM
-- NÃO deleta nenhum dado ou campo
-- NÃO dá erro se tabela não existir
-- ==========================================

DO $$
DECLARE
  tabela TEXT;
  tabelas_basicas TEXT[] := ARRAY[
    'profiles', 'tenants', 'requisicoes', 'itens_requisicao',
    'sequencias_numeracao', 'fornecedores', 'categorias', 'centros_custo',
    'cotacoes', 'cotacao_fornecedores', 'pedidos', 'pedido_itens'
  ];
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'ADICIONANDO PERMISSÕES';
  RAISE NOTICE '===========================================';

  -- Dar permissões em cada tabela que existe
  FOREACH tabela IN ARRAY tabelas_basicas
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tabela) THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tabela);
      RAISE NOTICE '✅ Permissões adicionadas em: %', tabela;
    ELSE
      RAISE NOTICE '⏭️ Tabela não existe (ok): %', tabela;
    END IF;
  END LOOP;

  -- Dar acesso às sequences
  EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated';
  RAISE NOTICE '✅ Acesso a sequences concedido';

  RAISE NOTICE '===========================================';
END $$;

-- PARTE 2: POLÍTICAS RLS - PROFILES
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    EXECUTE 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem ver seu próprio profile" ON profiles';
    EXECUTE 'CREATE POLICY "Usuários podem ver seu próprio profile"
      ON profiles FOR SELECT TO authenticated
      USING (auth.uid() = id)';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio profile" ON profiles';
    EXECUTE 'CREATE POLICY "Usuários podem atualizar seu próprio profile"
      ON profiles FOR UPDATE TO authenticated
      USING (auth.uid() = id)';

    RAISE NOTICE '✅ Políticas RLS criadas em profiles';
  END IF;
END $$;

-- PARTE 3: POLÍTICAS RLS - TENANTS
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN
    EXECUTE 'ALTER TABLE tenants ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem ver o tenant da sua empresa" ON tenants';
    EXECUTE 'CREATE POLICY "Usuários podem ver o tenant da sua empresa"
      ON tenants FOR SELECT TO authenticated
      USING (id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    RAISE NOTICE '✅ Políticas RLS criadas em tenants';
  END IF;
END $$;

-- PARTE 4: POLÍTICAS RLS - REQUISICOES
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

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem deletar requisições do seu tenant" ON requisicoes';
    EXECUTE 'CREATE POLICY "Usuários podem deletar requisições do seu tenant"
      ON requisicoes FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    RAISE NOTICE '✅ Políticas RLS criadas em requisicoes';
  END IF;
END $$;

-- PARTE 5: POLÍTICAS RLS - ITENS_REQUISICAO
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'itens_requisicao') THEN
    EXECUTE 'ALTER TABLE itens_requisicao ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem ver itens de requisições do seu tenant" ON itens_requisicao';
    EXECUTE 'CREATE POLICY "Usuários podem ver itens de requisições do seu tenant"
      ON itens_requisicao FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM requisicoes r
          WHERE r.id = requisicao_id
          AND r.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        )
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem criar itens no seu tenant" ON itens_requisicao';
    EXECUTE 'CREATE POLICY "Usuários podem criar itens no seu tenant"
      ON itens_requisicao FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM requisicoes r
          WHERE r.id = requisicao_id
          AND r.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        )
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem atualizar itens do seu tenant" ON itens_requisicao';
    EXECUTE 'CREATE POLICY "Usuários podem atualizar itens do seu tenant"
      ON itens_requisicao FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM requisicoes r
          WHERE r.id = requisicao_id
          AND r.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        )
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem deletar itens do seu tenant" ON itens_requisicao';
    EXECUTE 'CREATE POLICY "Usuários podem deletar itens do seu tenant"
      ON itens_requisicao FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM requisicoes r
          WHERE r.id = requisicao_id
          AND r.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        )
      )';

    RAISE NOTICE '✅ Políticas RLS criadas em itens_requisicao';
  END IF;
END $$;

-- PARTE 6: POLÍTICAS RLS - SEQUENCIAS_NUMERACAO
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sequencias_numeracao') THEN
    EXECUTE 'ALTER TABLE sequencias_numeracao ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem acessar sequências do seu tenant" ON sequencias_numeracao';
    EXECUTE 'CREATE POLICY "Usuários podem acessar sequências do seu tenant"
      ON sequencias_numeracao FOR ALL TO authenticated
      USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    RAISE NOTICE '✅ Políticas RLS criadas em sequencias_numeracao';
  END IF;
END $$;

-- PARTE 7: POLÍTICAS RLS - FORNECEDORES
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fornecedores') THEN
    EXECUTE 'ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem acessar fornecedores do seu tenant" ON fornecedores';
    EXECUTE 'CREATE POLICY "Usuários podem acessar fornecedores do seu tenant"
      ON fornecedores FOR ALL TO authenticated
      USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    RAISE NOTICE '✅ Políticas RLS criadas em fornecedores';
  END IF;
END $$;

-- PARTE 8: POLÍTICAS RLS - CATEGORIAS
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categorias') THEN
    EXECUTE 'ALTER TABLE categorias ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem acessar categorias do seu tenant" ON categorias';
    EXECUTE 'CREATE POLICY "Usuários podem acessar categorias do seu tenant"
      ON categorias FOR ALL TO authenticated
      USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    RAISE NOTICE '✅ Políticas RLS criadas em categorias';
  END IF;
END $$;

-- PARTE 9: POLÍTICAS RLS - CENTROS_CUSTO
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'centros_custo') THEN
    EXECUTE 'ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem acessar centros de custo do seu tenant" ON centros_custo';
    EXECUTE 'CREATE POLICY "Usuários podem acessar centros de custo do seu tenant"
      ON centros_custo FOR ALL TO authenticated
      USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';

    RAISE NOTICE '✅ Políticas RLS criadas em centros_custo';
  END IF;
END $$;

-- PARTE 10: VERIFICAÇÃO FINAL
-- ==========================================

DO $$
DECLARE
  pol_count INTEGER;
  tabela TEXT;
  tabelas TEXT[] := ARRAY[
    'profiles', 'tenants', 'requisicoes', 'itens_requisicao',
    'sequencias_numeracao', 'fornecedores', 'categorias', 'centros_custo'
  ];
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERIFICAÇÃO DE POLÍTICAS RLS';
  RAISE NOTICE '===========================================';

  FOREACH tabela IN ARRAY tabelas
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tabela) THEN
      SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = tabela;
      RAISE NOTICE '✅ %: % política(s)', tabela, pol_count;
    ELSE
      RAISE NOTICE '⏭️ % não existe (ok)', tabela;
    END IF;
  END LOOP;

  RAISE NOTICE '===========================================';
  RAISE NOTICE '🎉 SETUP COMPLETO!';
  RAISE NOTICE 'Agora você pode criar requisições sem erros';
  RAISE NOTICE '===========================================';
END $$;
