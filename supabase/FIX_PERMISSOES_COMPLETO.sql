-- ==========================================
-- FIX PERMISSÕES COMPLETO
-- ==========================================
-- Adiciona TODAS as permissões necessárias
-- NÃO deleta nenhum dado ou campo
-- ==========================================

-- PARTE 1: PERMISSÕES BÁSICAS EM TODAS AS TABELAS
-- ==========================================

-- Profiles e Tenants
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;

-- Requisições
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_requisicao TO authenticated;

-- Sequences (para numeração automática)
GRANT SELECT, INSERT, UPDATE ON public.sequencias_numeracao TO authenticated;

-- Fornecedores
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;

-- Categorias e Centros de Custo
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centros_custo TO authenticated;

-- Cotações
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacao_fornecedores TO authenticated;

-- Pedidos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_itens TO authenticated;

-- Dar acesso a todas as sequences (IDs automáticos)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- PARTE 2: POLÍTICAS RLS - PROFILES
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

-- PARTE 3: POLÍTICAS RLS - TENANTS
-- ==========================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver o tenant da sua empresa" ON tenants;
CREATE POLICY "Usuários podem ver o tenant da sua empresa"
  ON tenants FOR SELECT TO authenticated
  USING (id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- PARTE 4: POLÍTICAS RLS - REQUISICOES
-- ==========================================

ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver requisições do seu tenant" ON requisicoes;
CREATE POLICY "Usuários podem ver requisições do seu tenant"
  ON requisicoes FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem criar requisições no seu tenant" ON requisicoes;
CREATE POLICY "Usuários podem criar requisições no seu tenant"
  ON requisicoes FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem atualizar requisições do seu tenant" ON requisicoes;
CREATE POLICY "Usuários podem atualizar requisições do seu tenant"
  ON requisicoes FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem deletar requisições do seu tenant" ON requisicoes;
CREATE POLICY "Usuários podem deletar requisições do seu tenant"
  ON requisicoes FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- PARTE 5: POLÍTICAS RLS - ITENS_REQUISICAO
-- ==========================================

ALTER TABLE itens_requisicao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver itens de requisições do seu tenant" ON itens_requisicao;
CREATE POLICY "Usuários podem ver itens de requisições do seu tenant"
  ON itens_requisicao FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requisicoes r
      WHERE r.id = requisicao_id
      AND r.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuários podem criar itens no seu tenant" ON itens_requisicao;
CREATE POLICY "Usuários podem criar itens no seu tenant"
  ON itens_requisicao FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requisicoes r
      WHERE r.id = requisicao_id
      AND r.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuários podem atualizar itens do seu tenant" ON itens_requisicao;
CREATE POLICY "Usuários podem atualizar itens do seu tenant"
  ON itens_requisicao FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requisicoes r
      WHERE r.id = requisicao_id
      AND r.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuários podem deletar itens do seu tenant" ON itens_requisicao;
CREATE POLICY "Usuários podem deletar itens do seu tenant"
  ON itens_requisicao FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requisicoes r
      WHERE r.id = requisicao_id
      AND r.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

-- PARTE 6: POLÍTICAS RLS - SEQUENCIAS_NUMERACAO
-- ==========================================

ALTER TABLE sequencias_numeracao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem acessar sequências do seu tenant" ON sequencias_numeracao;
CREATE POLICY "Usuários podem acessar sequências do seu tenant"
  ON sequencias_numeracao FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- PARTE 7: POLÍTICAS RLS - FORNECEDORES
-- ==========================================

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem acessar fornecedores do seu tenant" ON fornecedores;
CREATE POLICY "Usuários podem acessar fornecedores do seu tenant"
  ON fornecedores FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- PARTE 8: POLÍTICAS RLS - CATEGORIAS
-- ==========================================

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem acessar categorias do seu tenant" ON categorias;
CREATE POLICY "Usuários podem acessar categorias do seu tenant"
  ON categorias FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- PARTE 9: POLÍTICAS RLS - CENTROS_CUSTO
-- ==========================================

ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem acessar centros de custo do seu tenant" ON centros_custo;
CREATE POLICY "Usuários podem acessar centros de custo do seu tenant"
  ON centros_custo FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

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
      RAISE NOTICE '⚠️ % não existe', tabela;
    END IF;
  END LOOP;

  RAISE NOTICE '===========================================';
  RAISE NOTICE '🎉 SETUP COMPLETO!';
  RAISE NOTICE 'Agora você pode criar requisições sem erros de permissão';
  RAISE NOTICE '===========================================';
END $$;
