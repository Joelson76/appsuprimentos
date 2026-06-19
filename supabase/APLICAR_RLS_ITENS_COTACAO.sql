-- ==========================================
-- INSTRUÇÕES: Execute este SQL no SQL Editor do Supabase Dashboard
-- ==========================================
-- Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql/new
-- Cole este código e clique em RUN
-- ==========================================

-- Habilitar RLS na tabela itens_cotacao
ALTER TABLE itens_cotacao ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT (ler itens via cotacao do mesmo tenant)
CREATE POLICY "Usuários podem ver itens das cotações do seu tenant"
ON itens_cotacao FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cotacoes
    WHERE cotacoes.id = itens_cotacao.cotacao_id
      AND cotacoes.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  )
);

-- Policy: INSERT (apenas sistema/admin)
CREATE POLICY "Sistema pode inserir itens de cotação"
ON itens_cotacao FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cotacoes
    WHERE cotacoes.id = itens_cotacao.cotacao_id
      AND cotacoes.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  )
);

-- Policy: UPDATE (usuários autenticados do tenant podem marcar vencedor)
CREATE POLICY "Usuários podem atualizar itens das cotações do seu tenant"
ON itens_cotacao FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cotacoes
    WHERE cotacoes.id = itens_cotacao.cotacao_id
      AND cotacoes.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cotacoes
    WHERE cotacoes.id = itens_cotacao.cotacao_id
      AND cotacoes.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  )
);

-- Policy: DELETE (apenas admin)
CREATE POLICY "Sistema pode deletar itens de cotação"
ON itens_cotacao FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cotacoes
    WHERE cotacoes.id = itens_cotacao.cotacao_id
      AND cotacoes.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  )
);

-- Verificar resultado
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'itens_cotacao'
ORDER BY policyname;
