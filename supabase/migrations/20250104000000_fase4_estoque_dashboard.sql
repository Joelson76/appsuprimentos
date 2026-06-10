-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE tipo_movimentacao AS ENUM (
  'ENTRADA', 'SAIDA', 'AJUSTE_MAIS', 'AJUSTE_MENOS', 'TRANSFERENCIA'
);

-- ==========================================
-- TABELA: produtos
-- ==========================================
CREATE TABLE produtos (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  descricao             TEXT NOT NULL,
  codigo                TEXT,
  unidade               TEXT NOT NULL DEFAULT 'UN',
  categoria_id          UUID REFERENCES categorias(id),
  estoque_atual         NUMERIC(15,3) NOT NULL DEFAULT 0,
  estoque_minimo_alerta NUMERIC(15,3),
  localizacao           TEXT,
  ativo                 BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(codigo, tenant_id)
);

CREATE TRIGGER produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtos_tenant" ON produtos
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- TABELA: movimentacoes_estoque
-- ==========================================
CREATE TABLE movimentacoes_estoque (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  produto_id      UUID NOT NULL REFERENCES produtos(id),
  tipo            tipo_movimentacao NOT NULL,
  quantidade      NUMERIC(15,3) NOT NULL,
  saldo_anterior  NUMERIC(15,3) NOT NULL,
  saldo_posterior NUMERIC(15,3) NOT NULL,
  pedido_id       UUID REFERENCES ordens_compra(id),
  requisicao_id   UUID REFERENCES requisicoes(id),
  usuario_id      UUID NOT NULL REFERENCES profiles(id),
  observacao      TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movimentacoes_estoque_tenant" ON movimentacoes_estoque
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- FUNÇÃO: registrar movimentação e atualizar saldo
-- ==========================================
CREATE OR REPLACE FUNCTION movimentar_estoque(
  p_produto_id   UUID,
  p_tipo         tipo_movimentacao,
  p_quantidade   NUMERIC,
  p_pedido_id    UUID DEFAULT NULL,
  p_req_id       UUID DEFAULT NULL,
  p_observacao   TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_saldo_anterior  NUMERIC;
  v_saldo_posterior NUMERIC;
  v_tenant_id       UUID;
BEGIN
  SELECT estoque_atual, tenant_id INTO v_saldo_anterior, v_tenant_id
  FROM produtos WHERE id = p_produto_id;

  IF p_tipo IN ('ENTRADA', 'AJUSTE_MAIS') THEN
    v_saldo_posterior := v_saldo_anterior + p_quantidade;
  ELSE
    v_saldo_posterior := v_saldo_anterior - p_quantidade;
    IF v_saldo_posterior < 0 THEN
      RAISE EXCEPTION 'Saldo insuficiente para movimentação';
    END IF;
  END IF;

  UPDATE produtos SET estoque_atual = v_saldo_posterior WHERE id = p_produto_id;

  INSERT INTO movimentacoes_estoque (
    tenant_id, produto_id, tipo, quantidade,
    saldo_anterior, saldo_posterior,
    pedido_id, requisicao_id, usuario_id, observacao
  ) VALUES (
    v_tenant_id, p_produto_id, p_tipo, p_quantidade,
    v_saldo_anterior, v_saldo_posterior,
    p_pedido_id, p_req_id, auth.uid(), p_observacao
  );

  RETURN jsonb_build_object(
    'saldo_anterior', v_saldo_anterior,
    'saldo_posterior', v_saldo_posterior
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGER: criar entrada de estoque automaticamente ao confirmar recebimento
-- ==========================================
CREATE OR REPLACE FUNCTION entrada_estoque_recebimento()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_produto_id UUID;
BEGIN
  IF NEW.status IN ('COMPLETO', 'PARCIAL') AND OLD.status = 'PENDENTE' THEN
    FOR v_item IN
      SELECT ir.descricao, ir.quantidade_recebida, r.tenant_id, r.pedido_id
      FROM itens_recebimento ir
      JOIN recebimentos r ON r.id = ir.recebimento_id
      WHERE ir.recebimento_id = NEW.id
    LOOP
      -- Buscar ou criar produto
      SELECT id INTO v_produto_id FROM produtos
      WHERE tenant_id = v_item.tenant_id AND descricao ILIKE v_item.descricao
      LIMIT 1;

      IF v_produto_id IS NULL THEN
        INSERT INTO produtos (tenant_id, descricao)
        VALUES (v_item.tenant_id, v_item.descricao)
        RETURNING id INTO v_produto_id;
      END IF;

      PERFORM movimentar_estoque(
        v_produto_id, 'ENTRADA', v_item.quantidade_recebida,
        v_item.pedido_id, NULL, 'Recebimento automático'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estoque_apos_recebimento
  AFTER UPDATE ON recebimentos
  FOR EACH ROW EXECUTE FUNCTION entrada_estoque_recebimento();

-- ==========================================
-- VIEWS PARA DASHBOARD (otimizadas)
-- ==========================================

-- KPIs do mês atual
CREATE OR REPLACE VIEW vw_kpis_dashboard AS
SELECT
  tenant_id,
  SUM(CASE WHEN DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', NOW())
    THEN valor_total ELSE 0 END) AS gasto_mes_atual,
  SUM(CASE WHEN DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    THEN valor_total ELSE 0 END) AS gasto_mes_anterior,
  COUNT(CASE WHEN status NOT IN ('CANCELADA', 'RECEBIDA', 'FATURADA') THEN 1 END) AS pos_abertas,
  COUNT(CASE WHEN DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', NOW())
    THEN 1 END) AS pos_mes_atual
FROM ordens_compra
GROUP BY tenant_id;

-- Gasto por categoria (mês atual)
CREATE OR REPLACE VIEW vw_gasto_por_categoria AS
SELECT
  r.tenant_id,
  c.nome AS categoria,
  SUM(ir.valor_estimado) AS total
FROM itens_requisicao ir
JOIN categorias c ON c.id = ir.categoria_id
JOIN requisicoes r ON r.id = ir.requisicao_id
WHERE DATE_TRUNC('month', r.criado_em) = DATE_TRUNC('month', NOW())
GROUP BY r.tenant_id, c.nome;

-- Top fornecedores (mês atual)
CREATE OR REPLACE VIEW vw_top_fornecedores AS
SELECT
  oc.tenant_id,
  f.razao_social,
  COUNT(*) AS num_pedidos,
  SUM(oc.valor_total) AS total
FROM ordens_compra oc
JOIN fornecedores f ON f.id = oc.fornecedor_id
WHERE DATE_TRUNC('month', oc.criado_em) = DATE_TRUNC('month', NOW())
  AND oc.status NOT IN ('CANCELADA', 'RASCUNHO')
GROUP BY oc.tenant_id, f.razao_social
ORDER BY total DESC;

-- ==========================================
-- TABELA: notificacoes_pendentes
-- ==========================================
CREATE TABLE notificacoes_pendentes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL,
  tipo       TEXT NOT NULL,
  payload    JSONB,
  enviado    BOOLEAN DEFAULT FALSE,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- JOB: alerta de estoque mínimo (pg_cron diário às 07:00 BRT = 10:00 UTC)
-- ==========================================
SELECT cron.schedule(
  'alerta-estoque-minimo',
  '0 10 * * *',
  $$
    INSERT INTO notificacoes_pendentes (tenant_id, tipo, payload)
    SELECT tenant_id, 'ESTOQUE_MINIMO',
      jsonb_agg(jsonb_build_object(
        'produto_id', id,
        'descricao', descricao,
        'estoque_atual', estoque_atual,
        'estoque_minimo', estoque_minimo_alerta
      ))
    FROM produtos
    WHERE ativo = TRUE
      AND estoque_minimo_alerta IS NOT NULL
      AND estoque_atual <= estoque_minimo_alerta
    GROUP BY tenant_id;
  $$
);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================
CREATE INDEX idx_produtos_tenant ON produtos(tenant_id);
CREATE INDEX idx_produtos_estoque_minimo ON produtos(tenant_id, estoque_atual, estoque_minimo_alerta)
  WHERE ativo = TRUE AND estoque_minimo_alerta IS NOT NULL;

CREATE INDEX idx_movimentacoes_tenant ON movimentacoes_estoque(tenant_id);
CREATE INDEX idx_movimentacoes_produto ON movimentacoes_estoque(produto_id);
CREATE INDEX idx_movimentacoes_criado ON movimentacoes_estoque(criado_em DESC);

CREATE INDEX idx_ordens_compra_tenant_mes ON ordens_compra(tenant_id, DATE_TRUNC('month', criado_em));
CREATE INDEX idx_requisicoes_tenant_mes ON requisicoes(tenant_id, DATE_TRUNC('month', criado_em));
