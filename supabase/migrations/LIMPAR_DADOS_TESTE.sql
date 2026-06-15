-- ==========================================
-- SCRIPT PARA LIMPAR DADOS DE TESTE
-- ==========================================
-- ⚠️ ATENÇÃO: Este script apaga TODOS os dados de:
-- - Fornecedores
-- - Requisições
-- - Cotações
-- - Pedidos (Ordens de Compra)
-- - Contratos
-- - Notas Fiscais
-- - Avaliações
-- - Histórico de Preços
-- - Aprovações
-- - NFe Importadas
--
-- NÃO apaga:
-- - Usuários
-- - Tenants
-- - Produtos
-- - Categorias
-- - Centros de Custo
-- - Assinaturas
-- ==========================================

DO $$
DECLARE
  v_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INICIANDO LIMPEZA DE DADOS DE TESTE';
  RAISE NOTICE '========================================';

  -- 1. DELETAR HISTÓRICO DE PREÇOS
  DELETE FROM historico_precos;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Histórico de preços: % registros deletados', v_count;

  -- 2. DELETAR AVALIAÇÕES DE FORNECEDORES
  DELETE FROM avaliacoes_fornecedores;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Avaliações de fornecedores: % registros deletados', v_count;

  -- 3. DELETAR MÉTRICAS DE FORNECEDORES
  DELETE FROM metricas_fornecedores;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Métricas de fornecedores: % registros deletados', v_count;

  -- 4. DELETAR APROVAÇÕES
  DELETE FROM aprovacoes;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Aprovações: % registros deletados', v_count;

  -- 5. DELETAR NFE IMPORTADAS
  DELETE FROM nfe_importadas;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ NF-e importadas: % registros deletados', v_count;

  -- 6. DELETAR NOTAS FISCAIS
  DELETE FROM notas_fiscais;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Notas fiscais: % registros deletados', v_count;

  -- 7. DELETAR CONTRATOS
  DELETE FROM contratos;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Contratos: % registros deletados', v_count;

  -- 8. DELETAR ITENS DE PEDIDOS (CASCADE vai deletar automaticamente)
  DELETE FROM itens_po;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Itens de pedidos: % registros deletados', v_count;

  -- 9. DELETAR PEDIDOS (ORDENS DE COMPRA)
  DELETE FROM ordens_compra;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Pedidos (ordens de compra): % registros deletados', v_count;

  -- 10. DELETAR ITENS DE COTAÇÃO
  DELETE FROM itens_cotacao;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Itens de cotação: % registros deletados', v_count;

  -- 11. DELETAR COTAÇÕES
  DELETE FROM cotacoes;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Cotações: % registros deletados', v_count;

  -- 12. DELETAR ITENS DE REQUISIÇÃO
  DELETE FROM itens_requisicao;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Itens de requisição: % registros deletados', v_count;

  -- 13. DELETAR REQUISIÇÕES
  DELETE FROM requisicoes;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Requisições: % registros deletados', v_count;

  -- 14. DELETAR FORNECEDORES (por último, pois outros dependem dele)
  DELETE FROM fornecedores;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✓ Fornecedores: % registros deletados', v_count;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'LIMPEZA CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Dados mantidos:';
  RAISE NOTICE '✓ Usuários (profiles)';
  RAISE NOTICE '✓ Tenants';
  RAISE NOTICE '✓ Produtos';
  RAISE NOTICE '✓ Categorias';
  RAISE NOTICE '✓ Centros de Custo';
  RAISE NOTICE '✓ Assinaturas';
  RAISE NOTICE '✓ Faturas';
  RAISE NOTICE '✓ Alertas de Estoque';
  RAISE NOTICE '========================================';
END;
$$;
