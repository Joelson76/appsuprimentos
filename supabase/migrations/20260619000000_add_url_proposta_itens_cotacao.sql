-- ==========================================
-- Migration: Adicionar coluna url_proposta e observacoes à tabela itens_cotacao
-- Data: 2026-06-19
-- Objetivo: Permitir que fornecedores anexem propostas e observações aos itens da cotação
-- ==========================================

-- Adicionar coluna url_proposta (link para documento no Supabase Storage)
ALTER TABLE itens_cotacao
ADD COLUMN IF NOT EXISTS url_proposta TEXT;

-- Adicionar coluna observacoes (texto livre para comentários do fornecedor)
ALTER TABLE itens_cotacao
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criar índice para buscar itens com proposta anexada
CREATE INDEX IF NOT EXISTS idx_itens_cotacao_url_proposta
ON itens_cotacao(url_proposta)
WHERE url_proposta IS NOT NULL;

-- Comentários
COMMENT ON COLUMN itens_cotacao.url_proposta IS 'URL do documento de proposta anexado pelo fornecedor no Supabase Storage';
COMMENT ON COLUMN itens_cotacao.observacoes IS 'Observações/comentários adicionais do fornecedor sobre o item';
