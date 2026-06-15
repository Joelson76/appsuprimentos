-- ==========================================
-- FEATURE 5: Dashboard com KPIs Reais
-- ==========================================

-- View de KPIs consolidados
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
  (SELECT COUNT(*) FROM cotacoes c WHERE c.tenant_id = t.id AND DATE_TRUNC('month', c.criado_em) = DATE_TRUNC('month', NOW())) as cotacoes_mes,

  -- Pedidos
  (SELECT COUNT(*) FROM ordens_compra oc WHERE oc.tenant_id = t.id) as total_pedidos,
  (SELECT COALESCE(SUM(oc.valor_total), 0) FROM ordens_compra oc WHERE oc.tenant_id = t.id) as valor_total_pedidos,
  (SELECT COALESCE(SUM(oc.valor_total), 0) FROM ordens_compra oc WHERE oc.tenant_id = t.id AND DATE_TRUNC('month', oc.criado_em) = DATE_TRUNC('month', NOW())) as valor_pedidos_mes,
  (SELECT COUNT(*) FROM ordens_compra oc WHERE oc.tenant_id = t.id AND oc.status = 'AGUARDANDO_APROVACAO') as pedidos_pendentes,

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

-- View de evolução mensal de compras
CREATE OR REPLACE VIEW vw_evolucao_compras_mensal AS
SELECT
  oc.tenant_id,
  DATE_TRUNC('month', oc.criado_em) as mes,
  COUNT(*) as qtd_pedidos,
  SUM(oc.valor_total) as valor_total,
  AVG(oc.valor_total) as ticket_medio,
  COUNT(DISTINCT oc.fornecedor_id) as fornecedores_distintos
FROM ordens_compra oc
WHERE oc.status NOT IN ('CANCELADA', 'RASCUNHO')
  AND oc.criado_em >= NOW() - INTERVAL '12 months'
GROUP BY oc.tenant_id, DATE_TRUNC('month', oc.criado_em)
ORDER BY mes DESC;

-- View de top fornecedores
CREATE OR REPLACE VIEW vw_top_fornecedores AS
SELECT
  f.id,
  f.tenant_id,
  f.razao_social,
  f.score,
  COUNT(DISTINCT oc.id) as total_pedidos,
  SUM(oc.valor_total) as valor_total,
  AVG(oc.valor_total) as ticket_medio,
  MAX(oc.criado_em) as ultimo_pedido
FROM fornecedores f
LEFT JOIN ordens_compra oc ON oc.fornecedor_id = f.id AND oc.status NOT IN ('CANCELADA', 'RASCUNHO')
GROUP BY f.id, f.tenant_id, f.razao_social, f.score
HAVING COUNT(DISTINCT oc.id) > 0
ORDER BY valor_total DESC;

-- View de produtos mais comprados (DESABILITADA - itens_po não tem produto_id)
-- Será implementada quando houver vinculação produto <-> item

-- View de saving (economia com cotações) - DESABILITADA
-- Cotações não têm valor_total (apenas itens individuais)
-- Será implementada quando houver agregação de valores

-- View de lead time médio
CREATE OR REPLACE VIEW vw_lead_time_pedidos AS
SELECT
  oc.tenant_id,
  f.razao_social as fornecedor,
  COUNT(*) as qtd_pedidos,
  AVG(EXTRACT(DAY FROM oc.prazo_entrega - oc.criado_em::DATE))::NUMERIC(10,1) as lead_time_medio_dias,
  MIN(EXTRACT(DAY FROM oc.prazo_entrega - oc.criado_em::DATE))::INT as lead_time_minimo,
  MAX(EXTRACT(DAY FROM oc.prazo_entrega - oc.criado_em::DATE))::INT as lead_time_maximo
FROM ordens_compra oc
JOIN fornecedores f ON f.id = oc.fornecedor_id
WHERE oc.status IN ('RECEBIDA', 'FATURADA')
  AND oc.prazo_entrega IS NOT NULL
  AND oc.criado_em >= NOW() - INTERVAL '6 months'
GROUP BY oc.tenant_id, f.razao_social, f.id
HAVING COUNT(*) >= 3
ORDER BY lead_time_medio_dias;

-- View de categorias mais compradas (DESABILITADA - itens_po não tem produto_id)
-- Será implementada quando houver vinculação produto <-> item

-- View de taxa de aprovação
CREATE OR REPLACE VIEW vw_taxa_aprovacao AS
SELECT
  tenant_id,
  DATE_TRUNC('month', criado_em) as mes,
  tipo_documento,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'APROVADO') as aprovados,
  COUNT(*) FILTER (WHERE status = 'REJEITADO') as rejeitados,
  COUNT(*) FILTER (WHERE status = 'PENDENTE') as pendentes,
  CASE
    WHEN COUNT(*) > 0 THEN
      (COUNT(*) FILTER (WHERE status = 'APROVADO')::NUMERIC / COUNT(*) * 100)
    ELSE 0
  END as taxa_aprovacao_pct
FROM aprovacoes
WHERE criado_em >= NOW() - INTERVAL '12 months'
GROUP BY tenant_id, DATE_TRUNC('month', criado_em), tipo_documento
ORDER BY mes DESC, tipo_documento;

-- Função para gerar snapshot diário de métricas (para histórico)
CREATE TABLE IF NOT EXISTS snapshots_diarios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  data        DATE NOT NULL DEFAULT CURRENT_DATE,
  metricas    JSONB NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, data)
);

ALTER TABLE snapshots_diarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_diarios_tenant" ON snapshots_diarios
  FOR ALL
  USING (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID)
  WITH CHECK (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID);

-- Função para gerar snapshot
CREATE OR REPLACE FUNCTION gerar_snapshot_diario(p_tenant_id UUID)
RETURNS void AS $$
DECLARE
  v_metricas JSONB;
BEGIN
  SELECT to_jsonb(k.*) INTO v_metricas
  FROM vw_dashboard_kpis k
  WHERE k.tenant_id = p_tenant_id;

  INSERT INTO snapshots_diarios (tenant_id, data, metricas)
  VALUES (p_tenant_id, CURRENT_DATE, v_metricas)
  ON CONFLICT (tenant_id, data)
  DO UPDATE SET metricas = v_metricas, criado_em = NOW();
END;
$$ LANGUAGE plpgsql;
