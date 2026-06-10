-- ==========================================
-- Adicionar campos de aprovação em requisicoes
-- ==========================================
-- Este script adiciona os campos necessários para aprovação
-- NÃO deleta nenhum dado
-- ==========================================

DO $$
BEGIN
  -- Adicionar campo aprovado_por
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'requisicoes'
    AND column_name = 'aprovado_por'
  ) THEN
    ALTER TABLE requisicoes ADD COLUMN aprovado_por UUID REFERENCES profiles(id);
    RAISE NOTICE '✅ Campo aprovado_por adicionado';
  ELSE
    RAISE NOTICE '⚠️ Campo aprovado_por já existe';
  END IF;

  -- Adicionar campo aprovado_em
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'requisicoes'
    AND column_name = 'aprovado_em'
  ) THEN
    ALTER TABLE requisicoes ADD COLUMN aprovado_em TIMESTAMPTZ;
    RAISE NOTICE '✅ Campo aprovado_em adicionado';
  ELSE
    RAISE NOTICE '⚠️ Campo aprovado_em já existe';
  END IF;

  -- Adicionar campo observacoes_aprovacao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'requisicoes'
    AND column_name = 'observacoes_aprovacao'
  ) THEN
    ALTER TABLE requisicoes ADD COLUMN observacoes_aprovacao TEXT;
    RAISE NOTICE '✅ Campo observacoes_aprovacao adicionado';
  ELSE
    RAISE NOTICE '⚠️ Campo observacoes_aprovacao já existe';
  END IF;

  RAISE NOTICE '===========================================';
  RAISE NOTICE '🎉 Campos de aprovação configurados!';
  RAISE NOTICE '===========================================';
END $$;

-- Listar todos os campos de requisicoes para conferir
SELECT
  'Campos da tabela requisicoes' as info,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as campos
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'requisicoes';
