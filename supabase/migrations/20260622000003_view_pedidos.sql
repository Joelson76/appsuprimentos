-- ==========================================
-- MIGRATION: View "pedidos" apontando para "ordens_compra"
-- Data: 2026-06-22
-- Descrição: Cria uma view para compatibilidade, já que o código usa "pedidos"
--            mas a tabela real é "ordens_compra"
-- ==========================================

-- Verificar se existe tabela "pedidos" e removê-la
DO $$
BEGIN
  -- Se existir uma tabela chamada "pedidos", removê-la
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'pedidos'
  ) THEN
    -- Se for uma tabela, drop
    EXECUTE 'DROP TABLE IF EXISTS pedidos CASCADE';
  END IF;

  -- Se existir uma view, removê-la
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name = 'pedidos'
  ) THEN
    EXECUTE 'DROP VIEW IF EXISTS pedidos CASCADE';
  END IF;
END $$;

-- Criar VIEW pedidos que aponta para ordens_compra
CREATE VIEW pedidos AS
SELECT * FROM ordens_compra;

-- Habilitar RLS na view (usar security_invoker para herdar permissões da tabela base)
ALTER VIEW pedidos SET (security_invoker = true);

-- Comentário
COMMENT ON VIEW pedidos IS
'View de compatibilidade que aponta para a tabela ordens_compra.
Permite que o código use "pedidos" sem precisar alterar todas as referências.';
