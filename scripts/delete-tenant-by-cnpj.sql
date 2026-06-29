-- =====================================================
-- Script de Deleção Completa de Dados por CNPJ
-- CNPJ: 03869985000184
-- =====================================================
-- ATENÇÃO: Este script DELETA PERMANENTEMENTE todos os dados
--
-- COMO EXECUTAR:
-- 1. Supabase Dashboard > SQL Editor
-- 2. Cole este script completo
-- 3. Execute
-- =====================================================

DO $$
DECLARE
  v_tenant_id uuid;
  v_cnpj text := '03869985000184';
  v_user_ids uuid[];
  v_user_id uuid;
  v_count int;
BEGIN
  -- Buscar tenant_id pelo CNPJ (pode estar na tabela tenants ou filiais)
  SELECT id INTO v_tenant_id
  FROM public.tenants
  WHERE cnpj = v_cnpj;

  -- Se não encontrou, tenta buscar pela filial
  IF v_tenant_id IS NULL THEN
    SELECT tenant_id INTO v_tenant_id
    FROM public.filiais
    WHERE cnpj = v_cnpj;
  END IF;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CNPJ % NÃO ENCONTRADO no sistema', v_cnpj;
    RAISE NOTICE '========================================';
    RETURN;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tenant ID encontrado: %', v_tenant_id;
  RAISE NOTICE 'Iniciando deleção de TODOS os dados...';
  RAISE NOTICE '========================================';

  -- ========================================
  -- DELEÇÃO EM CASCATA (respeitando FK)
  -- ========================================

  -- 1. Itens de pedidos (não tem tenant_id, vinculado via pedido_id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itens_pedido') THEN
    SELECT COUNT(*) INTO v_count FROM public.itens_pedido
    WHERE pedido_id IN (SELECT id FROM public.pedidos WHERE tenant_id = v_tenant_id);

    DELETE FROM public.itens_pedido
    WHERE pedido_id IN (SELECT id FROM public.pedidos WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '✓ Itens de pedidos deletados: %', v_count;
  END IF;

  -- 2. Pedidos/Ordens de Compra
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pedidos') THEN
    SELECT COUNT(*) INTO v_count FROM public.pedidos WHERE tenant_id = v_tenant_id;
    DELETE FROM public.pedidos WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Pedidos deletados: %', v_count;
  END IF;

  -- 3. Itens de cotação (não tem tenant_id, vinculado via cotacao_id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itens_cotacao') THEN
    SELECT COUNT(*) INTO v_count FROM public.itens_cotacao
    WHERE cotacao_id IN (SELECT id FROM public.cotacoes WHERE tenant_id = v_tenant_id);

    DELETE FROM public.itens_cotacao
    WHERE cotacao_id IN (SELECT id FROM public.cotacoes WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '✓ Itens de cotação deletados: %', v_count;
  END IF;

  -- 4. Cotações
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cotacoes') THEN
    SELECT COUNT(*) INTO v_count FROM public.cotacoes WHERE tenant_id = v_tenant_id;
    DELETE FROM public.cotacoes WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Cotações deletadas: %', v_count;
  END IF;

  -- 5. Itens de requisição (não tem tenant_id, vinculado via requisicao_id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itens_requisicao') THEN
    SELECT COUNT(*) INTO v_count FROM public.itens_requisicao
    WHERE requisicao_id IN (SELECT id FROM public.requisicoes WHERE tenant_id = v_tenant_id);

    DELETE FROM public.itens_requisicao
    WHERE requisicao_id IN (SELECT id FROM public.requisicoes WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '✓ Itens de requisição deletados: %', v_count;
  END IF;

  -- 6. Requisições
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requisicoes') THEN
    SELECT COUNT(*) INTO v_count FROM public.requisicoes WHERE tenant_id = v_tenant_id;
    DELETE FROM public.requisicoes WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Requisições deletadas: %', v_count;
  END IF;

  -- 7. Fornecedores
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fornecedores') THEN
    SELECT COUNT(*) INTO v_count FROM public.fornecedores WHERE tenant_id = v_tenant_id;
    DELETE FROM public.fornecedores WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Fornecedores deletados: %', v_count;
  END IF;

  -- 8. Produtos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'produtos') THEN
    SELECT COUNT(*) INTO v_count FROM public.produtos WHERE tenant_id = v_tenant_id;
    DELETE FROM public.produtos WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Produtos deletados: %', v_count;
  END IF;

  -- 9. Histórico de preços (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'historico_precos') THEN
    SELECT COUNT(*) INTO v_count FROM public.historico_precos WHERE tenant_id = v_tenant_id;
    DELETE FROM public.historico_precos WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Histórico de preços deletado: %', v_count;
  END IF;

  -- 10. Alertas de estoque (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alertas_estoque') THEN
    SELECT COUNT(*) INTO v_count FROM public.alertas_estoque WHERE tenant_id = v_tenant_id;
    DELETE FROM public.alertas_estoque WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Alertas deletados: %', v_count;
  END IF;

  -- 11. Avaliações de fornecedores (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'avaliacoes_fornecedor') THEN
    SELECT COUNT(*) INTO v_count FROM public.avaliacoes_fornecedor WHERE tenant_id = v_tenant_id;
    DELETE FROM public.avaliacoes_fornecedor WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Avaliações deletadas: %', v_count;
  END IF;

  -- 12. Notas fiscais (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notas_fiscais') THEN
    SELECT COUNT(*) INTO v_count FROM public.notas_fiscais WHERE tenant_id = v_tenant_id;
    DELETE FROM public.notas_fiscais WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Notas fiscais deletadas: %', v_count;
  END IF;

  -- 13. Pagamentos/Transações (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pagamentos') THEN
    SELECT COUNT(*) INTO v_count FROM public.pagamentos WHERE tenant_id = v_tenant_id;
    DELETE FROM public.pagamentos WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Pagamentos deletados: %', v_count;
  END IF;

  -- 14. Assinaturas (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assinaturas') THEN
    SELECT COUNT(*) INTO v_count FROM public.assinaturas WHERE tenant_id = v_tenant_id;
    DELETE FROM public.assinaturas WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Assinaturas deletadas: %', v_count;
  END IF;

  -- 15. Filiais
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'filiais') THEN
    SELECT COUNT(*) INTO v_count FROM public.filiais WHERE tenant_id = v_tenant_id;
    DELETE FROM public.filiais WHERE tenant_id = v_tenant_id;
    RAISE NOTICE '✓ Filiais deletadas: %', v_count;
  END IF;

  -- 16. Armazenar IDs dos usuários antes de deletar profiles
  SELECT ARRAY_AGG(id) INTO v_user_ids
  FROM public.profiles
  WHERE tenant_id = v_tenant_id;

  -- 17. Profiles
  SELECT COUNT(*) INTO v_count FROM public.profiles WHERE tenant_id = v_tenant_id;
  DELETE FROM public.profiles WHERE tenant_id = v_tenant_id;
  RAISE NOTICE '✓ Profiles deletados: %', v_count;

  -- 18. Tenant
  DELETE FROM public.tenants WHERE id = v_tenant_id;
  RAISE NOTICE '✓ Tenant deletado';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DELEÇÃO COMPLETA DOS DADOS DO TENANT!';
  RAISE NOTICE 'CNPJ: %', v_cnpj;
  RAISE NOTICE '========================================';

  -- 19. Informar sobre usuários do auth.users
  IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMO PASSO: Deletar % usuário(s) manualmente:', array_length(v_user_ids, 1);
    RAISE NOTICE '1. Supabase > Authentication > Users';
    RAISE NOTICE '2. Para cada usuário abaixo, clique nos 3 pontos > Delete user:';

    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      RAISE NOTICE '   - User ID: %', v_user_id;
    END LOOP;
  END IF;

  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ERRO: %', SQLERRM;
    RAISE NOTICE '========================================';
    RAISE EXCEPTION 'Erro ao deletar dados: %', SQLERRM;
END $$;
