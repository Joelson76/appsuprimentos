-- ==========================================
-- SCRIPT PARA LIMPAR DADOS DE UM TENANT ESPECÍFICO
-- ==========================================
-- ⚠️ SUBSTITUA 'SEU_TENANT_ID' PELO UUID DO SEU TENANT
-- ==========================================

DO $$
DECLARE
  v_tenant_id UUID := 'SEU_TENANT_ID'; -- ⚠️ ALTERE AQUI!
  v_count INT;
  v_tenant_nome TEXT;
BEGIN
  -- Verifica se o tenant existe
  SELECT nome INTO v_tenant_nome FROM tenants WHERE id = v_tenant_id;

  IF v_tenant_nome IS NULL THEN
    RAISE EXCEPTION 'Tenant % não encontrado! Verifique o ID.', v_tenant_id;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'LIMPANDO DADOS DO TENANT: %', v_tenant_nome;
  RAISE NOTICE 'ID: %', v_tenant_id;
  RAISE NOTICE '========================================';

  -- 1. DELETAR HISTÓRICO DE PREÇOS
  DELETE FROM historico_precos WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Histórico de preços: % registros', v_count;

  -- 2. DELETAR AVALIAÇÕES DE FORNECEDORES
  DELETE FROM avaliacoes_fornecedores WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Avaliações: % registros', v_count;

  -- 3. DELETAR MÉTRICAS DE FORNECEDORES
  DELETE FROM metricas_fornecedores WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Métricas: % registros', v_count;

  -- 4. DELETAR APROVAÇÕES
  DELETE FROM aprovacoes WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Aprovações: % registros', v_count;

  -- 5. DELETAR NFE IMPORTADAS
  DELETE FROM nfe_importadas WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ NF-e importadas: % registros', v_count;

  -- 6. DELETAR NOTAS FISCAIS
  DELETE FROM notas_fiscais WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Notas fiscais: % registros', v_count;

  -- 7. DELETAR CONTRATOS
  DELETE FROM contratos WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Contratos: % registros', v_count;

  -- 8. DELETAR ITENS DE PEDIDOS
  DELETE FROM itens_po WHERE pedido_id IN (
    SELECT id FROM ordens_compra WHERE tenant_id = v_tenant_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Itens de pedidos: % registros', v_count;

  -- 9. DELETAR PEDIDOS
  DELETE FROM ordens_compra WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Pedidos: % registros', v_count;

  -- 10. DELETAR ITENS DE COTAÇÃO
  DELETE FROM itens_cotacao WHERE cotacao_id IN (
    SELECT id FROM cotacoes WHERE tenant_id = v_tenant_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Itens de cotação: % registros', v_count;

  -- 11. DELETAR COTAÇÕES
  DELETE FROM cotacoes WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Cotações: % registros', v_count;

  -- 12. DELETAR ITENS DE REQUISIÇÃO
  DELETE FROM itens_requisicao WHERE requisicao_id IN (
    SELECT id FROM requisicoes WHERE tenant_id = v_tenant_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Itens de requisição: % registros', v_count;

  -- 13. DELETAR REQUISIÇÕES
  DELETE FROM requisicoes WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Requisições: % registros', v_count;

  -- 14. DELETAR FORNECEDORES
  DELETE FROM fornecedores WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Fornecedores: % registros', v_count;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'LIMPEZA CONCLUÍDA!';
  RAISE NOTICE 'Tenant: % (ID: %)', v_tenant_nome, v_tenant_id;
  RAISE NOTICE '========================================';
END;
$$;
