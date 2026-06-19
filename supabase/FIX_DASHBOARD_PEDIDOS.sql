-- ==========================================
-- FIX: Atualizar view do dashboard para usar tabela pedidos
-- ==========================================
-- Execute no Supabase SQL Editor
-- ==========================================

DROP VIEW IF EXISTS vw_dashboard_kpis CASCADE;

CREATE OR REPLACE VIEW vw_dashboard_kpis AS
SELECT
  t.id as tenant_id,

  -- Requisições
  (SELECT COUNT(*) FROM requisicoes r WHERE r.tenant_id = t.id) as total_requisicoes,
  (SELECT COUNT(*) FROM requisicoes r WHERE r.tenant_id = t.id AND r.status = 'AGUARDANDO_APROVACAO') as requisicoes_pendentes,
  (SELECT COUNT(*) FROM requisicoes r WHERE r.tenant_id = t.id AND r.status = 'APROVADA') as requisicoes_aprovadas,
  (SELECT COUNT(*) FROM requisicoes r WHERE r.tenant_id = t.id AND DATE_TRUNC('month', r.criado_em) = DATE_TRUNC('month', NOW())) as requisicoes_mes,

  -- Cotações
  (SELECT COUNT(*) FROM cotacoes c WHERE c.tenant_id = t.id) as total_cotacoes,
  (SELECT COUNT(*) FROM cotacoes c WHERE c.tenant_id = t.id AND c.status = 'AGUARDANDO_RESPOSTAS') as cotacoes_aguardando,
  (SELECT COUNT(*) FROM cotacoes c WHERE c.tenant_id = t.id AND DATE_TRUNC('month', r.criado_em) = DATE_TRUNC('month', NOW())) as cotacoes_mes,

  -- Pedidos (CORRIGIDO: usando tabela 'pedidos' ao invés de 'ordens_compra')
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

-- Atualizar também a view de evolução mensal
DROP VIEW IF EXISTS vw_evolucao_compras_mensal CASCADE;

CREATE OR REPLACE VIEW vw_evolucao_compras_mensal AS
SELECT
  p.tenant_id,
  DATE_TRUNC('month', p.criado_em) as mes,
  COUNT(*) as qtd_pedidos,
  SUM(p.valor_total) as valor_total,
  AVG(p.valor_total) as ticket_medio,
  COUNT(DISTINCT p.fornecedor_id) as fornecedores_distintos
FROM pedidos p
GROUP BY p.tenant_id, DATE_TRUNC('month', p.criado_em);

-- Atualizar view top fornecedores
DROP VIEW IF EXISTS vw_top_fornecedores CASCADE;

CREATE OR REPLACE VIEW vw_top_fornecedores AS
SELECT
  f.tenant_id,
  f.id,
  f.razao_social,
  f.nome_fantasia,
  f.score,
  COUNT(p.id) as total_pedidos,
  SUM(p.valor_total) as valor_total,
  AVG(EXTRACT(DAY FROM (p.criado_em - p.criado_em))) as lead_time_medio_dias
FROM fornecedores f
LEFT JOIN pedidos p ON p.fornecedor_id = f.id
GROUP BY f.tenant_id, f.id, f.razao_social, f.nome_fantasia, f.score
HAVING COUNT(p.id) > 0
ORDER BY valor_total DESC;

-- Verificar
SELECT 'Views atualizadas com sucesso!' as status;
