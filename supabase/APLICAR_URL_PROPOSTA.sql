-- ==========================================
-- INSTRUÇÕES: Execute este SQL no SQL Editor do Supabase Dashboard
-- ==========================================
-- Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql/new
-- Cole este código e clique em RUN
-- ==========================================

-- Adicionar colunas url_proposta e observacoes à tabela itens_cotacao
ALTER TABLE itens_cotacao
ADD COLUMN IF NOT EXISTS url_proposta TEXT;

ALTER TABLE itens_cotacao
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criar índice para buscar itens com proposta anexada
CREATE INDEX IF NOT EXISTS idx_itens_cotacao_url_proposta
ON itens_cotacao(url_proposta)
WHERE url_proposta IS NOT NULL;

-- Comentários
COMMENT ON COLUMN itens_cotacao.url_proposta IS 'URL do documento de proposta anexado pelo fornecedor no Supabase Storage';
COMMENT ON COLUMN itens_cotacao.observacoes IS 'Observações/comentários adicionais do fornecedor sobre o item';

-- Verificar resultado
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'itens_cotacao'
  AND column_name IN ('url_proposta', 'observacoes')
ORDER BY ordinal_position;
