-- ==========================================
-- FIX: Políticas RLS mais permissivas
-- ==========================================
-- Recria as políticas RLS para permitir INSERT
-- mesmo quando JWT claims não estão configurados
-- ==========================================

-- CONTRATOS
DROP POLICY IF EXISTS "contratos_tenant" ON contratos;

-- Policy para SELECT
CREATE POLICY "contratos_select" ON contratos
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy para INSERT
CREATE POLICY "contratos_insert" ON contratos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy para UPDATE
CREATE POLICY "contratos_update" ON contratos
  FOR UPDATE
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

-- Policy para DELETE
CREATE POLICY "contratos_delete" ON contratos
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- PRODUTOS
DROP POLICY IF EXISTS "produtos_tenant" ON produtos;

CREATE POLICY "produtos_select" ON produtos
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "produtos_insert" ON produtos
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "produtos_update" ON produtos
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "produtos_delete" ON produtos
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- NOTAS FISCAIS
DROP POLICY IF EXISTS "notas_fiscais_tenant" ON notas_fiscais;

CREATE POLICY "notas_fiscais_select" ON notas_fiscais
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "notas_fiscais_insert" ON notas_fiscais
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "notas_fiscais_update" ON notas_fiscais
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "notas_fiscais_delete" ON notas_fiscais
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- MOVIMENTAÇÕES DE ESTOQUE
DROP POLICY IF EXISTS "movimentacoes_estoque_tenant" ON movimentacoes_estoque;

CREATE POLICY "movimentacoes_estoque_select" ON movimentacoes_estoque
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "movimentacoes_estoque_insert" ON movimentacoes_estoque
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "movimentacoes_estoque_update" ON movimentacoes_estoque
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "movimentacoes_estoque_delete" ON movimentacoes_estoque
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS recriadas com sucesso';
  RAISE NOTICE 'Agora verificam tenant_id via profiles table em vez de JWT';
END $$;
