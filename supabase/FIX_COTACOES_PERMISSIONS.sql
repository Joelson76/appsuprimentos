-- ==========================================
-- FIX PERMISSÕES - Cotações e Fornecedores
-- ==========================================

-- PERMISSÕES BÁSICAS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_cotacao TO authenticated;

-- RLS - FORNECEDORES
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fornecedores_tenant" ON fornecedores;
DROP POLICY IF EXISTS "Usuários podem acessar fornecedores do seu tenant" ON fornecedores;

CREATE POLICY "Usuários podem acessar fornecedores do seu tenant"
  ON fornecedores FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- RLS - COTACOES
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cotacoes_tenant" ON cotacoes;
DROP POLICY IF EXISTS "Usuários podem acessar cotações do seu tenant" ON cotacoes;

CREATE POLICY "Usuários podem acessar cotações do seu tenant"
  ON cotacoes FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- RLS - ITENS_COTACAO
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'itens_cotacao') THEN
    EXECUTE 'ALTER TABLE itens_cotacao ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "itens_cotacao_tenant" ON itens_cotacao';
    EXECUTE 'DROP POLICY IF EXISTS "Usuários podem acessar itens de cotações do seu tenant" ON itens_cotacao';

    EXECUTE 'CREATE POLICY "Usuários podem acessar itens de cotações do seu tenant"
      ON itens_cotacao FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM cotacoes c
          WHERE c.id = cotacao_id
          AND c.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM cotacoes c
          WHERE c.id = cotacao_id
          AND c.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        )
      )';

    RAISE NOTICE '✅ Políticas RLS criadas para itens_cotacao';
  END IF;
END $$;

-- Tabela cotacao_fornecedores não existe, fornecedor_id está em itens_cotacao

-- VERIFICAÇÃO
DO $$
DECLARE
  pol_count INTEGER;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERIFICAÇÃO DE POLÍTICAS';
  RAISE NOTICE '===========================================';

  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'fornecedores';
  RAISE NOTICE '✅ Fornecedores: % política(s)', pol_count;

  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'cotacoes';
  RAISE NOTICE '✅ Cotações: % política(s)', pol_count;

  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'itens_cotacao';
  RAISE NOTICE '✅ Itens Cotação: % política(s)', pol_count;


  RAISE NOTICE '===========================================';
  RAISE NOTICE '🎉 Permissões configuradas!';
  RAISE NOTICE '===========================================';
END $$;
