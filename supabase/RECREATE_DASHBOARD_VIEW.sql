-- Recriar view do dashboard

DROP VIEW IF EXISTS vw_dashboard_kpis CASCADE;

CREATE VIEW vw_dashboard_kpis AS
SELECT
  t.id as tenant_id,

  -- Requisições
  (SELECT COUNT(*) FROM requisicoes r WHERE r.tenant_id = t.id) as total_requisicoes,
  (SELECT COUNT(*) FROM requisicoes r WHERE r.tenant_id = t.id AND r.status = 'AGUARDANDO_APROVACAO') as requisicoes_pendentes,
  (SELECT COUNT(*) FROM requisicoes r WHERE r.tenant_id = t.id AND r.status = 'APROVADA') as requisicoes_aprovadas,

  -- Cotações
  (SELECT COUNT(*) FROM cotacoes c WHERE c.tenant_id = t.id) as total_cotacoes,
  (SELECT COUNT(*) FROM cotacoes c WHERE c.tenant_id = t.id AND c.status = 'AGUARDANDO_RESPOSTAS') as cotacoes_abertas,

  -- Pedidos
  (SELECT COUNT(*) FROM pedidos p WHERE p.tenant_id = t.id) as total_pedidos,
  (SELECT COUNT(*) FROM pedidos p WHERE p.tenant_id = t.id AND p.status = 'APROVADO') as pedidos_aprovados,
  (SELECT COALESCE(SUM(p.valor_total), 0) FROM pedidos p WHERE p.tenant_id = t.id) as valor_total_pedidos,
  (SELECT COALESCE(SUM(p.valor_total), 0) FROM pedidos p WHERE p.tenant_id = t.id AND DATE_TRUNC('month', p.criado_em) = DATE_TRUNC('month', NOW())) as valor_pedidos_mes,

  -- Fornecedores
  (SELECT COUNT(*) FROM fornecedores f WHERE f.tenant_id = t.id) as total_fornecedores,
  (SELECT COUNT(*) FROM fornecedores f WHERE f.tenant_id = t.id AND f.status = 'ATIVO') as fornecedores_ativos,
  (SELECT COALESCE(AVG(f.score), 0) FROM fornecedores f WHERE f.tenant_id = t.id AND f.score IS NOT NULL) as score_medio_fornecedores,

  -- Aprovações (requisições + pedidos pendentes)
  (
    SELECT COUNT(*) FROM requisicoes r
    WHERE r.tenant_id = t.id
    AND r.status = 'AGUARDANDO_APROVACAO'
  ) + (
    SELECT COUNT(*) FROM pedidos p
    WHERE p.tenant_id = t.id
    AND p.status = 'PENDENTE'
  ) as aprovacoes_pendentes,

  -- Estoque (placeholder - ajustar conforme sua estrutura)
  0 as produtos_estoque_baixo,
  0 as produtos_ruptura

FROM tenants t;

-- Dar permissões
GRANT SELECT ON vw_dashboard_kpis TO authenticated;
GRANT SELECT ON vw_dashboard_kpis TO anon;

-- Testar
SELECT *
FROM vw_dashboard_kpis
WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid;
