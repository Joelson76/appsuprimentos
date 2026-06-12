-- ==========================================
-- FIX: Permissões para tabelas com RLS
-- ==========================================
-- Corrige permissões faltantes que causam erro 42501
-- ==========================================

-- Contratos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO anon;

-- Produtos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO anon;

-- Movimentações de Estoque
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_estoque TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_estoque TO anon;

-- Notas Fiscais (se ainda não tiver)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notas_fiscais TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notas_fiscais TO anon;

-- Categorias
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO anon;

-- Recebimentos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recebimentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recebimentos TO anon;

-- Itens Recebimento
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_recebimento TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_recebimento TO anon;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Permissões corrigidas para todas as tabelas';
END $$;
