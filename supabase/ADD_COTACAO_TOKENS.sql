-- ==========================================
-- Tokens de Acesso para Fornecedores
-- ==========================================
-- Permite que fornecedores acessem cotações via link único
-- ==========================================

-- Tabela para armazenar tokens de acesso
CREATE TABLE IF NOT EXISTS cotacao_acessos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  cotacao_id UUID NOT NULL REFERENCES cotacoes(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  acessado_em TIMESTAMPTZ,
  respondido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cotacao_id, fornecedor_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cotacao_acessos_token ON cotacao_acessos(token);
CREATE INDEX IF NOT EXISTS idx_cotacao_acessos_cotacao ON cotacao_acessos(cotacao_id);

-- RLS - Acesso público por token
ALTER TABLE cotacao_acessos ENABLE ROW LEVEL SECURITY;

-- Policy para acesso público (qualquer um pode ler por token)
DROP POLICY IF EXISTS "Acesso público por token" ON cotacao_acessos;
CREATE POLICY "Acesso público por token"
  ON cotacao_acessos FOR SELECT
  USING (true);

-- Policy para usuários autenticados do tenant
DROP POLICY IF EXISTS "Usuários podem gerenciar acessos do seu tenant" ON cotacao_acessos;
CREATE POLICY "Usuários podem gerenciar acessos do seu tenant"
  ON cotacao_acessos FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Permissões
GRANT SELECT ON cotacao_acessos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON cotacao_acessos TO authenticated;

-- Adicionar campos para resposta do fornecedor em itens_cotacao
DO $$
BEGIN
  -- prazo_entrega
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'itens_cotacao'
    AND column_name = 'prazo_entrega'
  ) THEN
    ALTER TABLE itens_cotacao ADD COLUMN prazo_entrega INTEGER;
  END IF;

  -- observacoes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'itens_cotacao'
    AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE itens_cotacao ADD COLUMN observacoes TEXT;
  END IF;
END $$;

-- Atualizar RLS de itens_cotacao para permitir update por token
DROP POLICY IF EXISTS "Acesso público para atualizar itens por token" ON itens_cotacao;
CREATE POLICY "Acesso público para atualizar itens por token"
  ON itens_cotacao FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cotacao_acessos ca
      WHERE ca.cotacao_id = itens_cotacao.cotacao_id
      AND ca.fornecedor_id = itens_cotacao.fornecedor_id
    )
  );

-- Permissão anon para update
GRANT UPDATE ON itens_cotacao TO anon;

-- Função para gerar token único
CREATE OR REPLACE FUNCTION gerar_token_cotacao()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '===========================================';
RAISE NOTICE '✅ Tabela cotacao_acessos criada';
RAISE NOTICE '✅ Campos prazo_entrega e observacoes adicionados';
RAISE NOTICE '✅ Políticas RLS configuradas';
RAISE NOTICE '===========================================';
