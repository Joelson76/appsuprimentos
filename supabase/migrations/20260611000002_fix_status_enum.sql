-- ==========================================
-- Corrigir ENUM de status da cotação
-- Adicionar novos status: RESPOSTAS_PARCIAIS e EM_ANALISE
-- ==========================================

-- Adicionar novos valores ao ENUM existente
ALTER TYPE status_cotacao ADD VALUE IF NOT EXISTS 'RESPOSTAS_PARCIAIS';
ALTER TYPE status_cotacao ADD VALUE IF NOT EXISTS 'EM_ANALISE';

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'ENUM status_cotacao atualizado com sucesso';
  RAISE NOTICE 'Novos valores: RESPOSTAS_PARCIAIS, EM_ANALISE';
END $$;
