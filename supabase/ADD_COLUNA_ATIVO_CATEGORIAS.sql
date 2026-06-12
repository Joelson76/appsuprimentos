-- ==========================================
-- ADD: Coluna ativo em categorias
-- ==========================================

-- Adicionar coluna ativo
ALTER TABLE categorias
ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

-- Verificar estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'categorias'
ORDER BY ordinal_position;
