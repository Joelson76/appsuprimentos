-- ==========================================
-- FEATURE 3: Avaliação de Fornecedores
-- ==========================================

-- Tabela de avaliações
CREATE TABLE avaliacoes_fornecedores (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  fornecedor_id     UUID NOT NULL REFERENCES fornecedores(id),
  pedido_id         UUID NOT NULL REFERENCES ordens_compra(id),

  -- Critérios de avaliação (1-5)
  nota_preco        INT CHECK (nota_preco BETWEEN 1 AND 5),
  nota_qualidade    INT CHECK (nota_qualidade BETWEEN 1 AND 5),
  nota_prazo        INT CHECK (nota_prazo BETWEEN 1 AND 5),
  nota_atendimento  INT CHECK (nota_atendimento BETWEEN 1 AND 5),

  -- Média calculada
  nota_geral        NUMERIC(3,2),

  comentarios       TEXT,
  problemas         TEXT[],

  avaliado_por      UUID NOT NULL REFERENCES profiles(id),
  avaliado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_avaliacoes_fornecedor ON avaliacoes_fornecedores(fornecedor_id, avaliado_em DESC);
CREATE INDEX idx_avaliacoes_pedido ON avaliacoes_fornecedores(pedido_id);

ALTER TABLE avaliacoes_fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avaliacoes_fornecedores_tenant" ON avaliacoes_fornecedores
  FOR ALL
  USING (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID)
  WITH CHECK (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID);

-- Trigger para calcular média
CREATE OR REPLACE FUNCTION calcular_nota_geral_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nota_geral := (
    COALESCE(NEW.nota_preco, 0) +
    COALESCE(NEW.nota_qualidade, 0) +
    COALESCE(NEW.nota_prazo, 0) +
    COALESCE(NEW.nota_atendimento, 0)
  )::NUMERIC / 4.0;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_nota_geral
  BEFORE INSERT OR UPDATE ON avaliacoes_fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION calcular_nota_geral_avaliacao();

-- Trigger para atualizar score do fornecedor
CREATE OR REPLACE FUNCTION atualizar_score_fornecedor()
RETURNS TRIGGER AS $$
DECLARE
  v_novo_score NUMERIC(3,1);
BEGIN
  -- Calcula média das últimas 10 avaliações
  SELECT ROUND(AVG(nota_geral)::NUMERIC, 1) INTO v_novo_score
  FROM (
    SELECT nota_geral
    FROM avaliacoes_fornecedores
    WHERE fornecedor_id = NEW.fornecedor_id
    ORDER BY avaliado_em DESC
    LIMIT 10
  ) recent;

  -- Atualiza score do fornecedor
  UPDATE fornecedores
  SET score = v_novo_score
  WHERE id = NEW.fornecedor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_score_fornecedor
  AFTER INSERT OR UPDATE ON avaliacoes_fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_score_fornecedor();

-- Tabela de métricas consolidadas do fornecedor
CREATE TABLE metricas_fornecedores (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  fornecedor_id           UUID NOT NULL REFERENCES fornecedores(id),

  -- Estatísticas de entrega
  total_pedidos           INT DEFAULT 0,
  pedidos_no_prazo        INT DEFAULT 0,
  pedidos_atrasados       INT DEFAULT 0,
  pedidos_com_problemas   INT DEFAULT 0,

  -- Lead time
  lead_time_medio_dias    NUMERIC(10,2),
  lead_time_minimo_dias   INT,
  lead_time_maximo_dias   INT,

  -- Valores
  valor_total_comprado    NUMERIC(15,2) DEFAULT 0,
  ticket_medio            NUMERIC(15,2),

  -- Qualidade
  taxa_conformidade_pct   NUMERIC(5,2), -- % pedidos sem problemas
  taxa_pontualidade_pct   NUMERIC(5,2), -- % pedidos no prazo

  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, fornecedor_id)
);

ALTER TABLE metricas_fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metricas_fornecedores_tenant" ON metricas_fornecedores
  FOR ALL
  USING (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID)
  WITH CHECK (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID);

-- Função para atualizar métricas do fornecedor
CREATE OR REPLACE FUNCTION atualizar_metricas_fornecedor(p_fornecedor_id UUID)
RETURNS void AS $$
DECLARE
  v_tenant_id UUID;
  v_total_pedidos INT;
  v_no_prazo INT;
  v_atrasados INT;
  v_com_problemas INT;
  v_lead_medio NUMERIC;
  v_lead_min INT;
  v_lead_max INT;
  v_valor_total NUMERIC;
  v_ticket_medio NUMERIC;
BEGIN
  -- Pega tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM fornecedores WHERE id = p_fornecedor_id;

  -- Calcula estatísticas dos pedidos
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('ENTREGUE', 'CONCLUIDO')),
    COUNT(*) FILTER (WHERE status = 'ATRASADO'),
    0, -- problemas (será baseado em avaliações)
    AVG(EXTRACT(DAY FROM data_entrega - criado_em)),
    MIN(EXTRACT(DAY FROM data_entrega - criado_em)),
    MAX(EXTRACT(DAY FROM data_entrega - criado_em)),
    SUM(valor_total),
    AVG(valor_total)
  INTO
    v_total_pedidos,
    v_no_prazo,
    v_atrasados,
    v_com_problemas,
    v_lead_medio,
    v_lead_min,
    v_lead_max,
    v_valor_total,
    v_ticket_medio
  FROM ordens_compra
  WHERE fornecedor_id = p_fornecedor_id
    AND status NOT IN ('CANCELADA', 'RASCUNHO');

  -- Conta problemas via avaliações
  SELECT COUNT(*) INTO v_com_problemas
  FROM avaliacoes_fornecedores
  WHERE fornecedor_id = p_fornecedor_id
    AND (nota_geral < 3 OR array_length(problemas, 1) > 0);

  -- Upsert nas métricas
  INSERT INTO metricas_fornecedores (
    tenant_id, fornecedor_id, total_pedidos, pedidos_no_prazo,
    pedidos_atrasados, pedidos_com_problemas,
    lead_time_medio_dias, lead_time_minimo_dias, lead_time_maximo_dias,
    valor_total_comprado, ticket_medio,
    taxa_conformidade_pct, taxa_pontualidade_pct
  ) VALUES (
    v_tenant_id, p_fornecedor_id, v_total_pedidos, v_no_prazo,
    v_atrasados, v_com_problemas,
    v_lead_medio, v_lead_min, v_lead_max,
    v_valor_total, v_ticket_medio,
    CASE WHEN v_total_pedidos > 0 THEN ((v_total_pedidos - v_com_problemas)::NUMERIC / v_total_pedidos * 100) ELSE 0 END,
    CASE WHEN v_total_pedidos > 0 THEN (v_no_prazo::NUMERIC / v_total_pedidos * 100) ELSE 0 END
  )
  ON CONFLICT (tenant_id, fornecedor_id)
  DO UPDATE SET
    total_pedidos = v_total_pedidos,
    pedidos_no_prazo = v_no_prazo,
    pedidos_atrasados = v_atrasados,
    pedidos_com_problemas = v_com_problemas,
    lead_time_medio_dias = v_lead_medio,
    lead_time_minimo_dias = v_lead_min,
    lead_time_maximo_dias = v_lead_max,
    valor_total_comprado = v_valor_total,
    ticket_medio = v_ticket_medio,
    taxa_conformidade_pct = CASE WHEN v_total_pedidos > 0 THEN ((v_total_pedidos - v_com_problemas)::NUMERIC / v_total_pedidos * 100) ELSE 0 END,
    taxa_pontualidade_pct = CASE WHEN v_total_pedidos > 0 THEN (v_no_prazo::NUMERIC / v_total_pedidos * 100) ELSE 0 END,
    atualizado_em = NOW();
END;
$$ LANGUAGE plpgsql;

-- View consolidada de desempenho de fornecedores
CREATE OR REPLACE VIEW vw_desempenho_fornecedores AS
SELECT
  f.id,
  f.tenant_id,
  f.razao_social,
  f.cnpj,
  f.score,
  f.status,
  m.total_pedidos,
  m.taxa_pontualidade_pct,
  m.taxa_conformidade_pct,
  m.lead_time_medio_dias,
  m.valor_total_comprado,
  m.ticket_medio,
  COUNT(a.id) as total_avaliacoes,
  AVG(a.nota_geral) as media_avaliacoes
FROM fornecedores f
LEFT JOIN metricas_fornecedores m ON m.fornecedor_id = f.id
LEFT JOIN avaliacoes_fornecedores a ON a.fornecedor_id = f.id
GROUP BY f.id, f.tenant_id, f.razao_social, f.cnpj, f.score, f.status,
         m.total_pedidos, m.taxa_pontualidade_pct, m.taxa_conformidade_pct,
         m.lead_time_medio_dias, m.valor_total_comprado, m.ticket_medio;
