-- Migration: Atualizar views para usar tabela 'pedidos' ao invés de 'ordens_compra'
-- Data: 2026-06-30

-- Dropar views existentes primeiro
DROP VIEW IF EXISTS vw_evolucao_compras_mensal CASCADE;
DROP VIEW IF EXISTS vw_breakdown_por_filial CASCADE;
DROP VIEW IF EXISTS vw_dashboard_kpis CASCADE;
DROP VIEW IF EXISTS vw_top_fornecedores CASCADE;

-- ==================== vw_evolucao_compras_mensal ====================
CREATE VIEW vw_evolucao_compras_mensal AS
SELECT
  p.tenant_id,
  DATE_TRUNC('month', p.criado_em) as mes,
  COUNT(*) as qtd_pedidos,
  SUM(p.valor_total) as valor_total,
  AVG(p.valor_total) as ticket_medio,
  COUNT(DISTINCT p.fornecedor_id) as fornecedores_distintos
FROM pedidos p
WHERE p.status NOT IN ('CANCELADO', 'RASCUNHO')
  AND p.criado_em >= NOW() - INTERVAL '12 months'
GROUP BY p.tenant_id, DATE_TRUNC('month', p.criado_em)
ORDER BY mes DESC;

COMMENT ON VIEW vw_evolucao_compras_mensal IS 'Evolução mensal de pedidos (últimos 12 meses)';

-- ==================== vw_breakdown_por_filial ====================
CREATE VIEW vw_breakdown_por_filial AS
SELECT
  f.tenant_id,
  f.id as filial_id,
  f.nome as filial_nome,
  f.cnpj,
  f.is_matriz,

  -- Requisições
  COUNT(DISTINCT r.id) as total_requisicoes,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'AGUARDANDO_APROVACAO') as requisicoes_pendentes,

  -- Pedidos
  COUNT(DISTINCT p.id) as total_pedidos,
  COALESCE(SUM(p.valor_total), 0) as valor_pedidos,

  -- Cotações
  COUNT(DISTINCT c.id) as total_cotacoes

FROM filiais f
LEFT JOIN requisicoes r ON r.filial_id = f.id AND r.tenant_id = f.tenant_id
LEFT JOIN pedidos p ON p.filial_id = f.id AND p.tenant_id = f.tenant_id AND p.status NOT IN ('CANCELADO', 'RASCUNHO')
LEFT JOIN cotacoes c ON c.filial_id = f.id AND c.tenant_id = f.tenant_id

WHERE f.ativa = true

GROUP BY f.tenant_id, f.id, f.nome, f.cnpj, f.is_matriz
ORDER BY f.is_matriz DESC, valor_pedidos DESC;

COMMENT ON VIEW vw_breakdown_por_filial IS 'Resumo de operações por filial';

-- ==================== vw_dashboard_kpis ====================
CREATE VIEW vw_dashboard_kpis AS
SELECT
  t.id as tenant_id,

  -- Requisições
  (SELECT COUNT(*) FROM requisicoes r WHERE r.tenant_id = t.id) as total_requisicoes,
  (SELECT COUNT(*) FROM requisicoes r WHERE r.tenant_id = t.id AND r.status = 'AGUARDANDO_APROVACAO') as requisicoes_pendentes,
  (SELECT COUNT(*) FROM requisicoes r WHERE r.tenant_id = t.id AND r.status = 'APROVADA') as requisicoes_aprovadas,

  -- Pedidos (usando tabela 'pedidos')
  (SELECT COUNT(*) FROM pedidos p WHERE p.tenant_id = t.id) as total_pedidos,
  (SELECT COALESCE(SUM(p.valor_total), 0) FROM pedidos p WHERE p.tenant_id = t.id) as valor_total_pedidos,
  (SELECT COALESCE(SUM(p.valor_total), 0) FROM pedidos p WHERE p.tenant_id = t.id AND DATE_TRUNC('month', p.criado_em) = DATE_TRUNC('month', NOW())) as valor_pedidos_mes,
  (SELECT COUNT(*) FROM pedidos p WHERE p.tenant_id = t.id AND p.status = 'PENDENTE') as pedidos_pendentes,

  -- Fornecedores
  (SELECT COUNT(*) FROM fornecedores f WHERE f.tenant_id = t.id) as total_fornecedores,
  (SELECT COUNT(*) FROM fornecedores f WHERE f.tenant_id = t.id AND f.status = 'ATIVO') as fornecedores_ativos,
  (SELECT AVG(f.score) FROM fornecedores f WHERE f.tenant_id = t.id AND f.score > 0) as score_medio_fornecedores,

  -- Produtos/Estoque
  (SELECT COUNT(*) FROM produtos p WHERE p.tenant_id = t.id AND p.ativo = true) as total_produtos,
  (SELECT COUNT(*) FROM produtos p WHERE p.tenant_id = t.id AND p.ativo = true AND p.estoque_atual < p.estoque_minimo_alerta) as produtos_estoque_baixo,
  (SELECT COUNT(*) FROM produtos p WHERE p.tenant_id = t.id AND p.ativo = true AND p.estoque_atual = 0) as produtos_ruptura,

  -- Alertas
  (SELECT COUNT(*) FROM alertas_estoque a WHERE a.tenant_id = t.id AND a.status = 'ABERTO') as alertas_abertos,
  (SELECT COUNT(*) FROM alertas_estoque a WHERE a.tenant_id = t.id AND a.status = 'ABERTO' AND a.prioridade = 'CRITICA') as alertas_criticos,

  -- Aprovações
  (SELECT COUNT(*) FROM aprovacoes a WHERE a.tenant_id = t.id AND a.status = 'PENDENTE') as aprovacoes_pendentes,
  (SELECT COUNT(*) FROM aprovacoes a WHERE a.tenant_id = t.id AND a.status = 'PENDENTE' AND a.prazo_ate < NOW()) as aprovacoes_atrasadas

FROM tenants t;

COMMENT ON VIEW vw_dashboard_kpis IS 'KPIs consolidados do dashboard (usando tabela pedidos)';

-- ==================== vw_top_fornecedores ====================
CREATE VIEW vw_top_fornecedores AS
SELECT
  f.id,
  f.tenant_id,
  f.razao_social,
  f.cnpj,
  f.score,
  COUNT(DISTINCT p.id) as total_pedidos,
  COALESCE(SUM(p.valor_total), 0) as valor_total,
  MAX(p.criado_em) as ultimo_pedido
FROM fornecedores f
LEFT JOIN pedidos p ON p.fornecedor_id = f.id
  AND p.tenant_id = f.tenant_id
  AND p.status NOT IN ('CANCELADO', 'RASCUNHO')
WHERE f.status = 'ATIVO'
GROUP BY f.id, f.tenant_id, f.razao_social, f.cnpj, f.score
HAVING COUNT(DISTINCT p.id) > 0
ORDER BY valor_total DESC;

COMMENT ON VIEW vw_top_fornecedores IS 'Top fornecedores por valor de pedidos';
