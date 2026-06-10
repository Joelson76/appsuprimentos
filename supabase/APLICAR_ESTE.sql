-- ==========================================
-- 🚀 APLICAR ESTE SCRIPT NO SUPABASE
-- ==========================================
-- Permissões e Políticas RLS para tabelas existentes
-- ==========================================

-- PARTE 1: PERMISSÕES BÁSICAS
-- ==========================================

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_requisicao TO authenticated;
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

-- PARTE 6: VERIFICAÇÃO
-- ==========================================

DO $$
DECLARE
  pol_count INTEGER;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERIFICAÇÃO FINAL';
  RAISE NOTICE '===========================================';

  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'profiles';
  RAISE NOTICE '✅ Profiles: % política(s)', pol_count;

  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'tenants';
  RAISE NOTICE '✅ Tenants: % política(s)', pol_count;

  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'requisicoes';
  RAISE NOTICE '✅ Requisições: % política(s)', pol_count;

  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'itens_requisicao';
  RAISE NOTICE '✅ Itens: % política(s)', pol_count;

  RAISE NOTICE '===========================================';
  RAISE NOTICE '🎉 SETUP COMPLETO!';
  RAISE NOTICE 'Agora você pode criar e aprovar requisições';
  RAISE NOTICE '===========================================';
END $$;
