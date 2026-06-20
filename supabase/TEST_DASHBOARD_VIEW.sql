-- Testar a view do dashboard diretamente

-- Seu tenant_id
SELECT 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid as meu_tenant;

-- Testar a view
SELECT *
FROM vw_dashboard_kpis
WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid;

-- Se a view não retornar nada, criar dados manualmente
SELECT
  'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid as tenant_id,
  (SELECT COUNT(*) FROM requisicoes WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid) as total_requisicoes,
  (SELECT COUNT(*) FROM requisicoes WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid AND status = 'AGUARDANDO_APROVACAO') as requisicoes_pendentes,
  (SELECT COUNT(*) FROM fornecedores WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid) as total_fornecedores,
  (SELECT COUNT(*) FROM fornecedores WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid AND status = 'ATIVO') as fornecedores_ativos,
  (SELECT COUNT(*) FROM cotacoes WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid) as total_cotacoes;
