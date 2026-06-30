-- ==========================================
-- FIX: Isolamento de Tenant em VIEWS
-- ==========================================
-- PROBLEMA: Views com security_invoker=true não são suficientes
-- SOLUÇÃO: Adicionar filtro explícito tenant_id em TODAS as views
-- ==========================================

-- ==========================================
-- 1️⃣ VW_PRODUTOS_MAIS_REQUISITADOS
-- ==========================================
CREATE OR REPLACE VIEW vw_produtos_mais_requisitados AS
SELECT
  p.id AS produto_id,
  p.descricao,
  p.codigo,
  p.classificacao,
  p.tenant_id,
  COUNT(DISTINCT ir.requisicao_id) AS total_requisicoes,
  SUM(ir.quantidade) AS quantidade_total,
  AVG(ir.quantidade) AS quantidade_media,
  MAX(r.criado_em) AS ultima_requisicao
FROM produtos p
INNER JOIN itens_requisicao ir ON ir.produto_id = p.id
INNER JOIN requisicoes r ON r.id = ir.requisicao_id
WHERE p.ativo = true
  -- 🔒 FILTRO TENANT: CRÍTICO!
  AND p.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
GROUP BY p.id, p.descricao, p.codigo, p.classificacao, p.tenant_id
ORDER BY total_requisicoes DESC;

ALTER VIEW vw_produtos_mais_requisitados SET (security_invoker = true);

COMMENT ON VIEW vw_produtos_mais_requisitados IS
'Produtos mais requisitados - FILTRADO POR TENANT via profiles.tenant_id';

-- ==========================================
-- 2️⃣ VW_PRODUTOS_POR_CLASSIFICACAO
-- ==========================================
CREATE OR REPLACE VIEW vw_produtos_por_classificacao AS
SELECT
  tenant_id,
  classificacao,
  COUNT(*) AS total_produtos,
  SUM(CASE WHEN ativo THEN 1 ELSE 0 END) AS produtos_ativos,
  SUM(CASE WHEN NOT ativo THEN 1 ELSE 0 END) AS produtos_inativos,
  SUM(estoque_atual) AS estoque_total,
  AVG(custo_medio) AS custo_medio_geral
FROM produtos
WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
GROUP BY tenant_id, classificacao;

ALTER VIEW vw_produtos_por_classificacao SET (security_invoker = true);

-- ==========================================
-- 3️⃣ VW_PRODUTOS_CRITICOS
-- ==========================================
CREATE OR REPLACE VIEW vw_produtos_criticos AS
SELECT
  p.*,
  ae.tipo_alerta,
  ae.mensagem,
  ae.criado_em AS alerta_criado_em
FROM produtos p
INNER JOIN alertas_estoque ae ON ae.produto_id = p.id
WHERE p.ativo = true
  AND ae.resolvido = false
  -- 🔒 FILTRO TENANT
  AND p.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
ORDER BY ae.criado_em DESC;

ALTER VIEW vw_produtos_criticos SET (security_invoker = true);

-- ==========================================
-- 4️⃣ VW_DASHBOARD_KPIS
-- ==========================================
CREATE OR REPLACE VIEW vw_dashboard_kpis AS
SELECT
  tenant_id,
  COUNT(DISTINCT r.id) AS total_requisicoes,
  COUNT(DISTINCT c.id) AS total_cotacoes,
  COUNT(DISTINCT o.id) AS total_pedidos,
  SUM(o.valor_total) AS valor_total_compras,
  AVG(o.valor_total) AS ticket_medio
FROM tenants t
LEFT JOIN requisicoes r ON r.tenant_id = t.id AND r.criado_em >= NOW() - INTERVAL '30 days'
LEFT JOIN cotacoes c ON c.tenant_id = t.id AND c.criado_em >= NOW() - INTERVAL '30 days'
LEFT JOIN ordens_compra o ON o.tenant_id = t.id AND o.criado_em >= NOW() - INTERVAL '30 days'
WHERE t.id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
GROUP BY t.id;

ALTER VIEW vw_dashboard_kpis SET (security_invoker = true);

-- ==========================================
-- 5️⃣ VW_TOP_FORNECEDORES
-- ==========================================
CREATE OR REPLACE VIEW vw_top_fornecedores AS
SELECT
  f.id,
  f.nome_fantasia,
  f.cnpj,
  f.tenant_id,
  COUNT(DISTINCT o.id) AS total_pedidos,
  SUM(o.valor_total) AS valor_total,
  AVG(o.valor_total) AS ticket_medio,
  MAX(o.criado_em) AS ultimo_pedido
FROM fornecedores f
INNER JOIN ordens_compra o ON o.fornecedor_id = f.id
WHERE f.ativo = true
  -- 🔒 FILTRO TENANT
  AND f.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
GROUP BY f.id, f.nome_fantasia, f.cnpj, f.tenant_id
ORDER BY valor_total DESC
LIMIT 10;

ALTER VIEW vw_top_fornecedores SET (security_invoker = true);

-- ==========================================
-- 6️⃣ VW_GASTO_POR_CATEGORIA
-- ==========================================
CREATE OR REPLACE VIEW vw_gasto_por_categoria AS
SELECT
  c.tenant_id,
  c.id AS categoria_id,
  c.nome AS categoria_nome,
  COUNT(DISTINCT o.id) AS total_pedidos,
  SUM(o.valor_total) AS valor_total,
  AVG(o.valor_total) AS valor_medio
FROM categorias c
LEFT JOIN produtos p ON p.categoria_id = c.id
LEFT JOIN itens_requisicao ir ON ir.produto_id = p.id
LEFT JOIN requisicoes r ON r.id = ir.requisicao_id
LEFT JOIN cotacoes co ON co.requisicao_id = r.id
LEFT JOIN ordens_compra o ON o.cotacao_id = co.id
WHERE c.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND o.criado_em >= NOW() - INTERVAL '90 days'
GROUP BY c.tenant_id, c.id, c.nome
ORDER BY valor_total DESC;

ALTER VIEW vw_gasto_por_categoria SET (security_invoker = true);

-- ==========================================
-- 7️⃣ VW_EVOLUCAO_COMPRAS_MENSAL
-- ==========================================
CREATE OR REPLACE VIEW vw_evolucao_compras_mensal AS
SELECT
  tenant_id,
  DATE_TRUNC('month', criado_em) AS mes,
  COUNT(id) AS total_pedidos,
  SUM(valor_total) AS valor_total,
  AVG(valor_total) AS valor_medio
FROM ordens_compra
WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND criado_em >= NOW() - INTERVAL '12 months'
GROUP BY tenant_id, DATE_TRUNC('month', criado_em)
ORDER BY mes DESC;

ALTER VIEW vw_evolucao_compras_mensal SET (security_invoker = true);

-- ==========================================
-- 8️⃣ VW_APROVACOES_PENDENTES
-- ==========================================
CREATE OR REPLACE VIEW vw_aprovacoes_pendentes AS
SELECT
  a.*,
  r.numero AS requisicao_numero,
  p.nome AS aprovador_nome,
  p.email AS aprovador_email
FROM aprovacoes a
INNER JOIN requisicoes r ON r.id = a.entidade_id
LEFT JOIN profiles p ON p.id = a.aprovador_id
WHERE a.status = 'PENDENTE'
  -- 🔒 FILTRO TENANT
  AND a.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
ORDER BY a.criado_em;

ALTER VIEW vw_aprovacoes_pendentes SET (security_invoker = true);

-- ==========================================
-- 9️⃣ VW_ITENS_REQUISICAO_COMPLETO
-- ==========================================
CREATE OR REPLACE VIEW vw_itens_requisicao_completo AS
SELECT
  ir.*,
  p.descricao AS produto_descricao,
  p.codigo AS produto_codigo,
  p.unidade AS produto_unidade,
  p.categoria_id AS produto_categoria_id,
  p.classificacao AS produto_classificacao,
  p.custo_medio AS produto_custo_medio,
  p.estoque_atual AS produto_estoque_atual,
  COALESCE(ir.descricao, p.descricao) AS descricao_final,
  COALESCE(ir.unidade, p.unidade) AS unidade_final
FROM itens_requisicao ir
LEFT JOIN produtos p ON ir.produto_id = p.id
WHERE ir.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid());

ALTER VIEW vw_itens_requisicao_completo SET (security_invoker = true);

-- ==========================================
-- MENSAGEM FINAL
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════╗';
  RAISE NOTICE '║   🔒 VIEWS SEGURAS - TENANT ISOLADO       ║';
  RAISE NOTICE '╚════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Todas as views agora têm filtro explícito:';
  RAISE NOTICE '   WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())';
  RAISE NOTICE '';
  RAISE NOTICE '✅ security_invoker = true mantido como camada extra';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Faça LOGOUT e LOGIN para testar!';
  RAISE NOTICE '';
END $$;
