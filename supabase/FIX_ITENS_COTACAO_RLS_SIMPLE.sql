-- RLS para itens_cotacao - Acesso Público via Token

-- Habilitar RLS
ALTER TABLE itens_cotacao ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Acesso público de leitura por token" ON itens_cotacao;
DROP POLICY IF EXISTS "Acesso público de atualização por token" ON itens_cotacao;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar itens" ON itens_cotacao;

-- Policy 1: Leitura pública
CREATE POLICY "Acesso público de leitura por token"
  ON itens_cotacao FOR SELECT
  TO anon
  USING (true);

-- Policy 2: Atualização pública
CREATE POLICY "Acesso público de atualização por token"
  ON itens_cotacao FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy 3: Usuários autenticados
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
  );

-- Permissões
GRANT SELECT, UPDATE ON itens_cotacao TO anon;
GRANT ALL ON itens_cotacao TO authenticated;
