-- Dar permissões em todas as tabelas relacionadas ao estoque

-- Tabela de alertas de estoque
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alertas_estoque TO authenticated;

-- Tabela de produtos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;

-- Tabela de categorias
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;

-- Tabela de movimentações de estoque (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'movimentacoes_estoque') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_estoque TO authenticated;
  END IF;
END $$;

-- Verificar se RLS está habilitado
SELECT
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('alertas_estoque', 'produtos', 'categorias', 'movimentacoes_estoque')
ORDER BY tablename;
