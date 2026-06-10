-- ==========================================
-- FIX: Permissões e Políticas RLS para Requisições
-- ==========================================

-- PASSO 1: Dar permissões básicas para tabelas de requisições
-- ==========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicao_itens TO authenticated;

-- Garantir acesso às sequences (para IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- PASSO 2: Criar políticas RLS para requisicoes
-- ==========================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver requisições do seu tenant" ON requisicoes;
DROP POLICY IF EXISTS "Usuários podem criar requisições no seu tenant" ON requisicoes;
DROP POLICY IF EXISTS "Usuários podem atualizar requisições do seu tenant" ON requisicoes;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias requisições em rascunho" ON requisicoes;

-- Política de SELECT: ver requisições do mesmo tenant
CREATE POLICY "Usuários podem ver requisições do seu tenant"
  ON requisicoes FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política de INSERT: criar requisições no seu tenant
CREATE POLICY "Usuários podem criar requisições no seu tenant"
  ON requisicoes FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política de UPDATE: atualizar requisições do seu tenant
-- (permite qualquer usuário do tenant atualizar - necessário para aprovação)
CREATE POLICY "Usuários podem atualizar requisições do seu tenant"
  ON requisicoes FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política de DELETE: apenas próprio solicitante pode deletar rascunhos
CREATE POLICY "Usuários podem deletar suas próprias requisições em rascunho"
  ON requisicoes FOR DELETE
  TO authenticated
  USING (
    solicitante_id = auth.uid() AND status = 'RASCUNHO'
  );

-- PASSO 3: Criar políticas RLS para requisicao_itens
-- ==========================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver itens de requisições do seu tenant" ON requisicao_itens;
DROP POLICY IF EXISTS "Usuários podem criar itens no seu tenant" ON requisicao_itens;
DROP POLICY IF EXISTS "Usuários podem atualizar itens do seu tenant" ON requisicao_itens;
DROP POLICY IF EXISTS "Usuários podem deletar itens do seu tenant" ON requisicao_itens;

-- Política de SELECT
CREATE POLICY "Usuários podem ver itens de requisições do seu tenant"
  ON requisicao_itens FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política de INSERT
CREATE POLICY "Usuários podem criar itens no seu tenant"
  ON requisicao_itens FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política de UPDATE
CREATE POLICY "Usuários podem atualizar itens do seu tenant"
  ON requisicao_itens FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política de DELETE
CREATE POLICY "Usuários podem deletar itens do seu tenant"
  ON requisicao_itens FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- PASSO 4: Garantir que RLS está habilitado
-- ==========================================

ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicao_itens ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Verificação
-- ==========================================

DO $$
DECLARE
  pol_count INTEGER;
BEGIN
  -- Contar políticas em requisicoes
  SELECT COUNT(*) INTO pol_count
  FROM pg_policies
  WHERE tablename = 'requisicoes';

  IF pol_count >= 4 THEN
    RAISE NOTICE '✅ Políticas RLS criadas para requisicoes (% políticas)', pol_count;
  ELSE
    RAISE WARNING '⚠️ Poucas políticas para requisicoes (% políticas)', pol_count;
  END IF;

  -- Contar políticas em requisicao_itens
  SELECT COUNT(*) INTO pol_count
  FROM pg_policies
  WHERE tablename = 'requisicao_itens';

  IF pol_count >= 4 THEN
    RAISE NOTICE '✅ Políticas RLS criadas para requisicao_itens (% políticas)', pol_count;
  ELSE
    RAISE WARNING '⚠️ Poucas políticas para requisicao_itens (% políticas)', pol_count;
  END IF;

  -- Verificar se RLS está habilitado
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'requisicoes'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS habilitado em requisicoes';
  ELSE
    RAISE WARNING '❌ RLS NÃO habilitado em requisicoes';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'requisicao_itens'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS habilitado em requisicao_itens';
  ELSE
    RAISE WARNING '❌ RLS NÃO habilitado em requisicao_itens';
  END IF;

  RAISE NOTICE '🎉 Setup de permissões de requisições completo!';
END $$;
