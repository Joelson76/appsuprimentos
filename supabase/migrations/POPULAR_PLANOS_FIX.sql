-- ==========================================
-- POPULAR TABELA PLANOS (CORRIGIDO)
-- ==========================================

-- Limpar dados antigos
TRUNCATE TABLE planos CASCADE;

-- Inserir planos (preco_centavos = valor em centavos)
INSERT INTO planos (nome, slug, preco_centavos, limite_usuarios, limite_pos_mes, limite_storage_mb, funcionalidades, ativo, ordem) VALUES
('Básico', 'BASICO', 9700, 5, 50, 1024, ARRAY['requisicoes','pedidos','fornecedores','aprovacoes','relatorios_basicos'], true, 1),
('Profissional', 'PROFISSIONAL', 29700, 20, 500, 10240, ARRAY['requisicoes','pedidos','fornecedores','aprovacoes','cotacoes','contratos','relatorios_avancados'], true, 2),
('Enterprise', 'ENTERPRISE', 99700, -1, -1, -1, ARRAY['tudo'], true, 3);

-- Dar permissões públicas
GRANT SELECT ON public.planos TO anon;
GRANT SELECT ON public.planos TO authenticated;

-- Verificar RLS
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública (anon)
DROP POLICY IF EXISTS "planos_public_read" ON planos;
CREATE POLICY "planos_public_read" ON planos
  FOR SELECT
  TO anon
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

-- Mostrar planos inseridos
SELECT
  nome,
  slug,
  preco_centavos / 100.0 as valor_reais,
  limite_usuarios,
  limite_pos_mes as max_pedidos_mes,
  ativo
FROM planos
ORDER BY ordem;
