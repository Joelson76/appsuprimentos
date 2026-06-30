-- ==========================================
-- FIX VIEWS DEFINITIVO: Apenas adiciona filtro tenant_id
-- SEM remover campos, SEM criar duplicatas
-- ==========================================

-- DROP views
DROP VIEW IF EXISTS vw_produtos_mais_requisitados CASCADE;
DROP VIEW IF EXISTS vw_produtos_por_classificacao CASCADE;
DROP VIEW IF EXISTS vw_produtos_criticos CASCADE;
DROP VIEW IF EXISTS vw_top_fornecedores CASCADE;
DROP VIEW IF EXISTS vw_gasto_por_categoria CASCADE;
DROP VIEW IF EXISTS vw_evolucao_compras_mensal CASCADE;
DROP VIEW IF EXISTS vw_aprovacoes_pendentes CASCADE;
DROP VIEW IF EXISTS vw_itens_requisicao_completo CASCADE;
DROP VIEW IF EXISTS vw_dashboard_kpis CASCADE;
DROP VIEW IF EXISTS vw_filiais_completo CASCADE;

-- 1️⃣ VW_PRODUTOS_MAIS_REQUISITADOS
CREATE VIEW vw_produtos_mais_requisitados AS
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
  AND p.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
GROUP BY p.id, p.descricao, p.codigo, p.classificacao, p.tenant_id
ORDER BY total_requisicoes DESC;

ALTER VIEW vw_produtos_mais_requisitados SET (security_invoker = true);

-- 2️⃣ VW_PRODUTOS_POR_CLASSIFICACAO
CREATE VIEW vw_produtos_por_classificacao AS
SELECT
  p.tenant_id,
  p.classificacao,
  COUNT(p.id) AS total_produtos,
  COUNT(CASE WHEN p.ativo = true THEN 1 END) AS produtos_ativos,
  COUNT(CASE WHEN p.estoque_atual > 0 THEN 1 END) AS produtos_com_estoque,
  SUM(CASE WHEN p.estoque_atual > 0 THEN p.estoque_atual ELSE 0 END) AS total_estoque,
  c.nome AS categoria_principal
FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.classificacao IS NOT NULL
  AND p.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
GROUP BY p.tenant_id, p.classificacao, c.nome;

ALTER VIEW vw_produtos_por_classificacao SET (security_invoker = true);

-- 3️⃣ VW_PRODUTOS_CRITICOS
CREATE VIEW vw_produtos_criticos AS
SELECT
  p.id,
  p.tenant_id,
  p.codigo,
  p.descricao,
  p.unidade,
  p.estoque_atual,
  p.estoque_minimo_alerta,
  p.localizacao,
  p.ativo,
  ae.tipo,
  ae.status,
  ae.prioridade,
  ae.estoque_atual AS alerta_estoque_atual,
  ae.estoque_minimo AS alerta_estoque_minimo,
  ae.estoque_maximo AS alerta_estoque_maximo,
  ae.criado_em AS alerta_criado_em
FROM produtos p
INNER JOIN alertas_estoque ae ON ae.produto_id = p.id
WHERE p.ativo = true
  AND ae.status IN ('ABERTO', 'EM_REPOSICAO')
  AND p.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
ORDER BY ae.prioridade DESC, ae.criado_em DESC;

ALTER VIEW vw_produtos_criticos SET (security_invoker = true);

-- 4️⃣ VW_TOP_FORNECEDORES
CREATE VIEW vw_top_fornecedores AS
SELECT
  f.id,
  f.razao_social,
  f.nome_fantasia,
  f.cnpj,
  f.tenant_id,
  f.status,
  f.score,
  f.email,
  f.telefone,
  COUNT(DISTINCT o.id) AS total_pedidos,
  COALESCE(SUM(o.valor_total), 0) AS valor_total,
  COALESCE(AVG(o.valor_total), 0) AS ticket_medio,
  MAX(o.criado_em) AS ultimo_pedido
FROM fornecedores f
LEFT JOIN ordens_compra o ON o.fornecedor_id = f.id
WHERE f.status = 'ATIVO'
  AND f.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
GROUP BY f.id, f.razao_social, f.nome_fantasia, f.cnpj, f.tenant_id, f.status, f.score, f.email, f.telefone
ORDER BY valor_total DESC
LIMIT 10;

ALTER VIEW vw_top_fornecedores SET (security_invoker = true);

-- 5️⃣ VW_GASTO_POR_CATEGORIA
CREATE VIEW vw_gasto_por_categoria AS
SELECT
  c.tenant_id,
  c.id AS categoria_id,
  c.nome AS categoria_nome,
  c.codigo,
  COUNT(DISTINCT o.id) AS total_pedidos,
  COALESCE(SUM(o.valor_total), 0) AS valor_total,
  COALESCE(AVG(o.valor_total), 0) AS valor_medio
FROM categorias c
LEFT JOIN produtos p ON p.categoria_id = c.id
LEFT JOIN itens_requisicao ir ON ir.produto_id = p.id
LEFT JOIN requisicoes r ON r.id = ir.requisicao_id
LEFT JOIN ordens_compra o ON o.requisicao_id = r.id
WHERE c.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (o.criado_em IS NULL OR o.criado_em >= NOW() - INTERVAL '90 days')
GROUP BY c.tenant_id, c.id, c.nome, c.codigo
ORDER BY valor_total DESC;

ALTER VIEW vw_gasto_por_categoria SET (security_invoker = true);

-- 6️⃣ VW_EVOLUCAO_COMPRAS_MENSAL
CREATE VIEW vw_evolucao_compras_mensal AS
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

-- 7️⃣ VW_APROVACOES_PENDENTES
CREATE VIEW vw_aprovacoes_pendentes AS
SELECT
  a.id,
  a.tenant_id,
  a.tipo_documento,
  a.documento_id,
  a.status,
  a.ordem,
  a.aprovador_id,
  a.prazo_ate,
  a.criado_em,
  r.numero AS requisicao_numero,
  p.nome AS aprovador_nome,
  u.email AS aprovador_email
FROM aprovacoes a
LEFT JOIN requisicoes r ON r.id = a.documento_id AND a.tipo_documento = 'REQUISICAO'
LEFT JOIN profiles p ON p.id = a.aprovador_id
LEFT JOIN auth.users u ON u.id = p.id
WHERE a.status = 'PENDENTE'
  AND a.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
ORDER BY a.criado_em;

ALTER VIEW vw_aprovacoes_pendentes SET (security_invoker = true);

-- 8️⃣ VW_ITENS_REQUISICAO_COMPLETO
CREATE VIEW vw_itens_requisicao_completo AS
SELECT
  ir.id,
  ir.requisicao_id,
  ir.produto_id,
  ir.quantidade,
  ir.unidade,
  ir.descricao,
  ir.valor_estimado,
  ir.categoria_id,
  r.tenant_id,
  r.numero AS requisicao_numero,
  r.status AS requisicao_status,
  p.descricao AS produto_descricao,
  p.codigo AS produto_codigo,
  p.unidade AS produto_unidade,
  p.categoria_id AS produto_categoria_id,
  p.classificacao AS produto_classificacao,
  p.estoque_atual AS produto_estoque_atual,
  COALESCE(ir.descricao, p.descricao) AS descricao_final,
  COALESCE(ir.unidade, p.unidade) AS unidade_final
FROM itens_requisicao ir
INNER JOIN requisicoes r ON r.id = ir.requisicao_id
LEFT JOIN produtos p ON ir.produto_id = p.id
WHERE r.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid());

ALTER VIEW vw_itens_requisicao_completo SET (security_invoker = true);

-- 9️⃣ VW_DASHBOARD_KPIS
CREATE VIEW vw_dashboard_kpis AS
SELECT
  t.id AS tenant_id,
  t.nome AS tenant_nome,
  COUNT(DISTINCT r.id) AS total_requisicoes,
  COUNT(DISTINCT c.id) AS total_cotacoes,
  COUNT(DISTINCT o.id) AS total_pedidos,
  COALESCE(SUM(o.valor_total), 0) AS valor_total_compras,
  COALESCE(AVG(o.valor_total), 0) AS ticket_medio
FROM tenants t
LEFT JOIN requisicoes r ON r.tenant_id = t.id AND r.criado_em >= NOW() - INTERVAL '30 days'
LEFT JOIN cotacoes c ON c.tenant_id = t.id AND c.criado_em >= NOW() - INTERVAL '30 days'
LEFT JOIN ordens_compra o ON o.tenant_id = t.id AND o.criado_em >= NOW() - INTERVAL '30 days'
WHERE t.id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
GROUP BY t.id, t.nome;

ALTER VIEW vw_dashboard_kpis SET (security_invoker = true);

-- 🔟 VW_FILIAIS_COMPLETO
-- Estrutura real: ativa (não ativo), sem tipo, sem endereco JSONB
CREATE VIEW vw_filiais_completo AS
SELECT
  f.id,
  f.tenant_id,
  f.cnpj,
  f.nome,
  f.nome_fantasia,
  f.is_matriz,
  f.ativa,
  f.cep,
  f.logradouro,
  f.numero,
  f.complemento,
  f.bairro,
  f.cidade,
  f.estado,
  f.criado_em,
  t.nome AS tenant_nome,
  COUNT(DISTINCT p.id) AS total_usuarios
FROM filiais f
INNER JOIN tenants t ON t.id = f.tenant_id
LEFT JOIN profiles p ON p.filial_id = f.id
WHERE f.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
GROUP BY f.id, f.cnpj, f.nome, f.nome_fantasia, f.is_matriz, f.ativa,
         f.cep, f.logradouro, f.numero, f.complemento, f.bairro, f.cidade, f.estado,
         f.criado_em, f.tenant_id, t.nome;

ALTER VIEW vw_filiais_completo SET (security_invoker = true);

-- ==========================================
-- MENSAGEM FINAL
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════╗';
  RAISE NOTICE '║   ✅ VIEWS COM ISOLAMENTO - DEFINITIVO    ║';
  RAISE NOTICE '╚════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 10 views recriadas com estrutura CORRETA';
  RAISE NOTICE '✅ Filtro: WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())';
  RAISE NOTICE '✅ Sem duplicatas, sem campos inexistentes';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 FAÇA LOGOUT E LOGIN para testar!';
  RAISE NOTICE '';
END $$;
