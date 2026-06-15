-- ==========================================
-- LIMPA TUDO E RECRIA DO ZERO
-- Use se quiser começar limpo
-- ==========================================

-- Dropa tudo na ordem reversa (para evitar erros de foreign key)
DROP VIEW IF EXISTS vw_aprovacoes_pendentes CASCADE;
DROP VIEW IF EXISTS vw_taxa_aprovacao CASCADE;
DROP VIEW IF EXISTS vw_categorias_compras CASCADE;
DROP VIEW IF EXISTS vw_lead_time_pedidos CASCADE;
DROP VIEW IF EXISTS vw_saving_cotacoes CASCADE;
DROP VIEW IF EXISTS vw_produtos_mais_comprados CASCADE;
DROP VIEW IF EXISTS vw_top_fornecedores CASCADE;
DROP VIEW IF EXISTS vw_evolucao_compras_mensal CASCADE;
DROP VIEW IF EXISTS vw_dashboard_kpis CASCADE;
DROP VIEW IF EXISTS vw_nfe_resumo CASCADE;
DROP VIEW IF EXISTS vw_desempenho_fornecedores CASCADE;
DROP VIEW IF EXISTS vw_produtos_criticos CASCADE;
DROP VIEW IF EXISTS vw_comparativo_precos CASCADE;

DROP TABLE IF EXISTS snapshots_diarios CASCADE;
DROP TABLE IF EXISTS nfe_importadas CASCADE;
DROP TABLE IF EXISTS aprovacoes CASCADE;
DROP TABLE IF EXISTS regras_alcada CASCADE;
DROP TABLE IF EXISTS metricas_fornecedores CASCADE;
DROP TABLE IF EXISTS avaliacoes_fornecedores CASCADE;
DROP TABLE IF EXISTS alertas_estoque CASCADE;
DROP TABLE IF EXISTS historico_precos CASCADE;

DROP FUNCTION IF EXISTS gerar_snapshot_diario(UUID) CASCADE;
DROP FUNCTION IF EXISTS atualizar_metricas_fornecedor(UUID) CASCADE;
DROP FUNCTION IF EXISTS processar_nfe_importada(UUID) CASCADE;
DROP FUNCTION IF EXISTS processar_aprovacao(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS pode_aprovar_documento(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS criar_aprovacoes_necessarias(TEXT, UUID, NUMERIC, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS atualizar_score_fornecedor() CASCADE;
DROP FUNCTION IF EXISTS calcular_nota_geral_avaliacao() CASCADE;
DROP FUNCTION IF EXISTS verificar_alertas_estoque() CASCADE;
DROP FUNCTION IF EXISTS registrar_historico_preco_pedido() CASCADE;
DROP FUNCTION IF EXISTS registrar_historico_preco_cotacao() CASCADE;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Todas as tabelas, views e funções foram removidas com sucesso!';
  RAISE NOTICE 'Agora execute PARTE_1_aplicar.sql e depois PARTE_2_aplicar.sql';
END
$$;
