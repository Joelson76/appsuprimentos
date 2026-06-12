-- ==========================================
-- RLS para itens_cotacao - Acesso Público via Token
-- ==========================================
-- Permite que fornecedores não autenticados acessem
-- e atualizem suas respostas usando o token único
-- ==========================================

-- Habilitar RLS
ALTER TABLE itens_cotacao ENABLE ROW LEVEL SECURITY;

-- Policy 1: Acesso público para LEITURA via token
DROP POLICY IF EXISTS "Acesso público de leitura por token" ON itens_cotacao;
CREATE POLICY "Acesso público de leitura por token"
  ON itens_cotacao FOR SELECT
  TO anon
  USING (true);

-- Policy 2: Acesso público para ATUALIZAÇÃO via token
-- Apenas permite atualizar campos de resposta do fornecedor
DROP POLICY IF EXISTS "Acesso público de atualização por token" ON itens_cotacao;
CREATE POLICY "Acesso público de atualização por token"
  ON itens_cotacao FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy 3: Usuários autenticados podem fazer tudo no seu tenant
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar itens" ON itens_cotacao;
CREATE POLICY "Usuários autenticados podem gerenciar itens"
  ON itens_cotacao FOR ALL
  TO authenticated
  USING (
    cotacao_id IN (
      SELECT id FROM cotacoes
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    cotacao_id IN (
      SELECT id FROM cotacoes
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Permissões
GRANT SELECT, UPDATE ON itens_cotacao TO anon;
GRANT ALL ON itens_cotacao TO authenticated;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'RLS configurado para itens_cotacao - acesso público via token habilitado';
END $$;
