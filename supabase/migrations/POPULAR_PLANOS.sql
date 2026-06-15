-- ==========================================
-- POPULAR TABELA PLANOS
-- ==========================================

-- Limpar dados antigos
TRUNCATE TABLE planos CASCADE;

-- Inserir planos
INSERT INTO planos (nome, slug, valor_mensal, max_usuarios, max_requisicoes, max_cotacoes, ativo) VALUES
('Básico', 'BASICO', 97.00, 5, 50, 20, true),
('Profissional', 'PROFISSIONAL', 297.00, 20, 500, 200, true),
('Enterprise', 'ENTERPRISE', 997.00, -1, -1, -1, true);

-- Dar permissões públicas
GRANT SELECT ON public.planos TO anon;
GRANT SELECT ON public.planos TO authenticated;

-- Verificar RLS
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública
DROP POLICY IF EXISTS "planos_public_read" ON planos;
CREATE POLICY "planos_public_read" ON planos
  FOR SELECT
  USING (ativo = true);

-- Policy para autenticados
DROP POLICY IF EXISTS "planos_authenticated_read" ON planos;
CREATE POLICY "planos_authenticated_read" ON planos
  FOR SELECT
  TO authenticated
  USING (true);

-- ==========================================
-- VERIFICAR
-- ==========================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM planos;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'PLANOS POPULADOS';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ % planos inseridos', v_count;
  RAISE NOTICE '✅ Permissions: anon e authenticated';
  RAISE NOTICE '✅ RLS habilitado com policies públicas';
  RAISE NOTICE '================================================';
END $$;

SELECT id, nome, slug, valor_mensal, ativo FROM planos ORDER BY valor_mensal;
