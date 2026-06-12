-- ==========================================
-- FIX: Desabilitar RLS em planos_precos
-- ==========================================
-- Esta tabela é pública e deve ser lida por todos

-- 1. Desabilitar RLS
ALTER TABLE planos_precos DISABLE ROW LEVEL SECURITY;

-- 2. Garantir permissões
GRANT SELECT ON planos_precos TO authenticated;
GRANT SELECT ON planos_precos TO anon;

-- 3. Verificar
SELECT * FROM planos_precos ORDER BY valor_mensal;
