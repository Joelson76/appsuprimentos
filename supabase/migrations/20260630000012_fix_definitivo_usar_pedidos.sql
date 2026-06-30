-- ==========================================
-- FIX DEFINITIVO: Garantir que tudo usa tabela PEDIDOS
-- ==========================================

-- 1. DELETAR tabela ordens_compra (está vazia e não é usada)
DROP TABLE IF EXISTS ordens_compra CASCADE;

-- 2. Atualizar TODAS as views que usavam ordens_compra

-- View: vw_evolucao_compras_mensal
DROP VIEW IF EXISTS vw_evolucao_compras_mensal CASCADE;
CREATE VIEW vw_evolucao_compras_mensal AS
SELECT
  DATE_TRUNC('month', p.criado_em)::date AS mes,
  p.tenant_id,
  COUNT(DISTINCT p.id) AS total_pedidos,
  SUM(p.valor_total) AS valor_total
FROM pedidos p
WHERE p.tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
)
GROUP BY DATE_TRUNC('month', p.criado_em), p.tenant_id
ORDER BY mes DESC;

ALTER VIEW vw_evolucao_compras_mensal SET (security_invoker = true);

-- View: vw_gasto_por_categoria
DROP VIEW IF EXISTS vw_gasto_por_categoria CASCADE;
CREATE VIEW vw_gasto_por_categoria AS
SELECT
  c.id AS categoria_id,
  c.nome AS categoria_nome,
  p.tenant_id,
  COUNT(DISTINCT ip.pedido_id) AS total_pedidos,
  SUM(ip.quantidade * ip.valor_unitario) AS valor_total
FROM categorias c
INNER JOIN produtos prod ON prod.categoria_id = c.id
INNER JOIN itens_pedido ip ON ip.produto_id = prod.id
INNER JOIN pedidos p ON p.id = ip.pedido_id
WHERE c.ativo = true
  AND p.tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
GROUP BY c.id, c.nome, p.tenant_id;

ALTER VIEW vw_gasto_por_categoria SET (security_invoker = true);

-- View: vw_top_fornecedores
DROP VIEW IF EXISTS vw_top_fornecedores CASCADE;
CREATE VIEW vw_top_fornecedores AS
SELECT
  f.id AS fornecedor_id,
  f.razao_social,
  f.nome_fantasia,
  f.tenant_id,
  COUNT(DISTINCT p.id) AS total_pedidos,
  SUM(p.valor_total) AS valor_total_comprado
FROM fornecedores f
INNER JOIN pedidos p ON p.fornecedor_id = f.id
WHERE f.status = 'ATIVO'
  AND f.tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
GROUP BY f.id, f.razao_social, f.nome_fantasia, f.tenant_id
ORDER BY valor_total_comprado DESC;

ALTER VIEW vw_top_fornecedores SET (security_invoker = true);

-- 3. Atualizar vw_dashboard_kpis (já fizemos mas garantir)
DROP VIEW IF EXISTS vw_dashboard_kpis CASCADE;
CREATE VIEW vw_dashboard_kpis AS
SELECT
  t.id AS tenant_id,
  t.nome AS tenant_nome,
  COUNT(DISTINCT r.id) AS total_requisicoes,
  COUNT(DISTINCT p.id) AS total_pedidos,
  COALESCE(SUM(p.valor_total), 0) AS valor_total_pedidos,
  COALESCE(
    SUM(CASE
      WHEN DATE_TRUNC('month', p.criado_em) = DATE_TRUNC('month', CURRENT_DATE)
      THEN p.valor_total
      ELSE 0
    END),
    0
  ) AS pedidos_mes_atual
FROM tenants t
LEFT JOIN requisicoes r ON r.tenant_id = t.id AND r.criado_em >= (NOW() - INTERVAL '30 days')
LEFT JOIN pedidos p ON p.tenant_id = t.id
WHERE t.id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
)
GROUP BY t.id, t.nome;

ALTER VIEW vw_dashboard_kpis SET (security_invoker = true);

-- 4. Comentários
COMMENT ON VIEW vw_dashboard_kpis IS 'KPIs do dashboard usando tabela PEDIDOS (não ordens_compra)';
COMMENT ON VIEW vw_evolucao_compras_mensal IS 'Evolução mensal usando tabela PEDIDOS';
COMMENT ON VIEW vw_gasto_por_categoria IS 'Gastos por categoria usando tabela PEDIDOS';
COMMENT ON VIEW vw_top_fornecedores IS 'Top fornecedores usando tabela PEDIDOS';

-- 5. Verificar que funcionou
SELECT 'Views atualizadas com sucesso!' as resultado;
