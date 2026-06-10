-- ==========================================
-- Adicionar campo observacao em itens_requisicao
-- ==========================================
-- Este script adiciona o campo observacao sem deletar nada
-- ==========================================

-- Verificar se o campo já existe antes de adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'itens_requisicao'
    AND column_name = 'observacao'
  ) THEN
    ALTER TABLE itens_requisicao ADD COLUMN observacao TEXT;
    RAISE NOTICE '✅ Campo observacao adicionado com sucesso';
  ELSE
    RAISE NOTICE '⚠️ Campo observacao já existe';
  END IF;
END $$;

-- Verificar se o campo produto existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'itens_requisicao'
    AND column_name = 'produto'
  ) THEN
    ALTER TABLE itens_requisicao ADD COLUMN produto TEXT;
    RAISE NOTICE '✅ Campo produto adicionado com sucesso';
  ELSE
    RAISE NOTICE '⚠️ Campo produto já existe';
  END IF;
END $$;

-- Listar todos os campos da tabela para conferir
DO $$
DECLARE
  col record;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'CAMPOS DA TABELA itens_requisicao:';
  RAISE NOTICE '===========================================';

  FOR col IN
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'itens_requisicao'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  % (%, nullable: %)', col.column_name, col.data_type, col.is_nullable;
  END LOOP;

  RAISE NOTICE '===========================================';
END $$;
