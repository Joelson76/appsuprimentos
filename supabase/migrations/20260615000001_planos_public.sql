-- Permitir leitura pública dos planos
-- (necessário para página pública de preços)

ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

-- Policy para permitir SELECT público (sem autenticação)
CREATE POLICY "planos_public_read" ON planos
  FOR SELECT
  USING (ativo = true);

-- Policy para usuários autenticados (garante acesso interno)
CREATE POLICY "planos_authenticated_read" ON planos
  FOR SELECT
  TO authenticated
  USING (true);
