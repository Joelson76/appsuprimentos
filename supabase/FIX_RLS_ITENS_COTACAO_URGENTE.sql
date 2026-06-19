-- ==========================================
-- FIX URGENTE: Corrigir RLS itens_cotacao
-- ==========================================
-- Execute IMEDIATAMENTE para voltar o sistema a funcionar!
-- ==========================================

-- REMOVER todas as policies que criamos (estão bloqueando o acesso)
DROP POLICY IF EXISTS "Usuários podem ver itens das cotações do seu tenant" ON itens_cotacao;
DROP POLICY IF EXISTS "Sistema pode inserir itens de cotação" ON itens_cotacao;
DROP POLICY IF EXISTS "Usuários podem atualizar itens das cotações do seu tenant" ON itens_cotacao;
DROP POLICY IF EXISTS "Sistema pode deletar itens de cotação" ON itens_cotacao;

-- RECRIAR com app_metadata (não user_metadata)

-- Policy: SELECT
CREATE POLICY "Usuários podem ver itens das cotações do seu tenant"
ON itens_cotacao FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cotacoes
    WHERE cotacoes.id = itens_cotacao.cotacao_id
      AND cotacoes.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
  )
);

-- Policy: INSERT
CREATE POLICY "Sistema pode inserir itens de cotação"
ON itens_cotacao FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cotacoes
    WHERE cotacoes.id = itens_cotacao.cotacao_id
      AND cotacoes.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
  )
);

-- Policy: UPDATE (permitir marcar vencedor)
CREATE POLICY "Usuários podem atualizar itens das cotações do seu tenant"
ON itens_cotacao FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cotacoes
    WHERE cotacoes.id = itens_cotacao.cotacao_id
      AND cotacoes.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cotacoes
    WHERE cotacoes.id = itens_cotacao.cotacao_id
      AND cotacoes.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
  )
);

-- Policy: DELETE
CREATE POLICY "Sistema pode deletar itens de cotação"
ON itens_cotacao FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cotacoes
    WHERE cotacoes.id = itens_cotacao.cotacao_id
      AND cotacoes.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
  )
);

-- Verificar
SELECT 'RLS corrigido com sucesso!' as status;
