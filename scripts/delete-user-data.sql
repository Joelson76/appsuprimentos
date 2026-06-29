-- =====================================================
-- Script de Deleção Completa de Dados do Usuário
-- Email: joelsonx86@gmail.com
-- =====================================================
-- ATENÇÃO: Este script DELETA PERMANENTEMENTE todos os dados
--
-- COMO EXECUTAR:
-- 1. Supabase Dashboard > SQL Editor
-- 2. Cole este script completo
-- 3. Execute (ele já usa as permissões corretas automaticamente)
-- =====================================================

DO $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_email text := 'joelsonx86@gmail.com';
BEGIN
  -- Buscar user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuário com email % não encontrado', v_email;
    RETURN;
  END IF;

  RAISE NOTICE 'User ID encontrado: %', v_user_id;

  -- Buscar tenant_id do profile
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'Tenant não encontrado para o usuário';
  ELSE
    RAISE NOTICE 'Tenant ID encontrado: %', v_tenant_id;

    -- ========================================
    -- DELEÇÃO EM CASCATA (respeitando FK)
    -- ========================================

    -- 1. Itens de pedidos
    DELETE FROM public.itens_pedido
    WHERE pedido_id IN (SELECT id FROM public.pedidos WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Itens de pedidos deletados';

    -- 2. Pedidos/Ordens de Compra
    DELETE FROM public.pedidos WHERE tenant_id = v_tenant_id;
    RAISE NOTICE 'Pedidos deletados';

    -- 3. Itens de cotação
    DELETE FROM public.itens_cotacao
    WHERE cotacao_id IN (SELECT id FROM public.cotacoes WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Itens de cotação deletados';

    -- 4. Cotações
    DELETE FROM public.cotacoes WHERE tenant_id = v_tenant_id;
    RAISE NOTICE 'Cotações deletadas';

    -- 5. Itens de requisição
    DELETE FROM public.itens_requisicao
    WHERE requisicao_id IN (SELECT id FROM public.requisicoes WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Itens de requisição deletados';

    -- 6. Requisições
    DELETE FROM public.requisicoes WHERE tenant_id = v_tenant_id;
    RAISE NOTICE 'Requisições deletadas';

    -- 7. Fornecedores
    DELETE FROM public.fornecedores WHERE tenant_id = v_tenant_id;
    RAISE NOTICE 'Fornecedores deletados';

    -- 8. Produtos
    DELETE FROM public.produtos WHERE tenant_id = v_tenant_id;
    RAISE NOTICE 'Produtos deletados';

    -- 9. Histórico de preços (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historico_precos') THEN
      DELETE FROM public.historico_precos WHERE tenant_id = v_tenant_id;
      RAISE NOTICE 'Histórico de preços deletado';
    END IF;

    -- 10. Alertas de estoque (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alertas_estoque') THEN
      DELETE FROM public.alertas_estoque WHERE tenant_id = v_tenant_id;
      RAISE NOTICE 'Alertas deletados';
    END IF;

    -- 11. Avaliações de fornecedores (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avaliacoes_fornecedor') THEN
      DELETE FROM public.avaliacoes_fornecedor WHERE tenant_id = v_tenant_id;
      RAISE NOTICE 'Avaliações deletadas';
    END IF;

    -- 12. Notas fiscais (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas_fiscais') THEN
      DELETE FROM public.notas_fiscais WHERE tenant_id = v_tenant_id;
      RAISE NOTICE 'Notas fiscais deletadas';
    END IF;

    -- 13. Pagamentos/Transações (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos') THEN
      DELETE FROM public.pagamentos WHERE tenant_id = v_tenant_id;
      RAISE NOTICE 'Pagamentos deletados';
    END IF;

    -- 14. Assinaturas (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assinaturas') THEN
      DELETE FROM public.assinaturas WHERE tenant_id = v_tenant_id;
      RAISE NOTICE 'Assinaturas deletadas';
    END IF;

    -- 15. Filiais (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'filiais') THEN
      DELETE FROM public.filiais WHERE tenant_id = v_tenant_id;
      RAISE NOTICE 'Filiais deletadas';
    END IF;

    -- 16. Outros profiles do mesmo tenant
    DELETE FROM public.profiles WHERE tenant_id = v_tenant_id AND id != v_user_id;
    RAISE NOTICE 'Outros profiles do tenant deletados';
  END IF;

  -- 17. Profile do usuário
  DELETE FROM public.profiles WHERE id = v_user_id;
  RAISE NOTICE 'Profile do usuário deletado';

  -- 18. Tenant (se existir)
  IF v_tenant_id IS NOT NULL THEN
    DELETE FROM public.tenants WHERE id = v_tenant_id;
    RAISE NOTICE 'Tenant deletado';
  END IF;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Dados do tenant removidos com sucesso!';
  RAISE NOTICE 'IMPORTANTE: Para deletar o usuário do auth.users, use o Dashboard:';
  RAISE NOTICE '  1. Supabase > Authentication > Users';
  RAISE NOTICE '  2. Busque: %', v_email;
  RAISE NOTICE '  3. Clique nos 3 pontos > Delete user';
  RAISE NOTICE '==============================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERRO: %', SQLERRM;
    RAISE EXCEPTION 'Erro ao deletar dados: %', SQLERRM;
END $$;
