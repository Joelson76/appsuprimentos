-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE status_recebimento AS ENUM (
  'PENDENTE', 'PARCIAL', 'COMPLETO', 'DIVERGENTE'
);

CREATE TYPE status_nf AS ENUM (
  'PENDENTE', 'CONFERIDA', 'APROVADA', 'DIVERGENTE', 'DEVOLVIDA'
);

CREATE TYPE status_contrato AS ENUM (
  'ATIVO', 'VENCENDO', 'VENCIDO', 'CANCELADO', 'EM_RENOVACAO'
);

-- ==========================================
-- TABELA: recebimentos
-- ==========================================
CREATE TABLE recebimentos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  pedido_id       UUID NOT NULL REFERENCES ordens_compra(id),
  recebido_por_id UUID NOT NULL REFERENCES profiles(id),
  status          status_recebimento NOT NULL DEFAULT 'PENDENTE',
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE recebimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recebimentos_tenant" ON recebimentos
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- TABELA: itens_recebimento
-- ==========================================
CREATE TABLE itens_recebimento (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recebimento_id       UUID NOT NULL REFERENCES recebimentos(id) ON DELETE CASCADE,
  descricao            TEXT NOT NULL,
  quantidade_pedida    NUMERIC(15,3) NOT NULL,
  quantidade_recebida  NUMERIC(15,3) NOT NULL,
  divergencia          BOOLEAN GENERATED ALWAYS AS (
    quantidade_recebida <> quantidade_pedida
  ) STORED,
  observacao           TEXT
);

ALTER TABLE itens_recebimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itens_recebimento_tenant" ON itens_recebimento
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recebimentos r
      WHERE r.id = recebimento_id
      AND r.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    )
  );

-- Trigger: atualizar status da PO após recebimento
CREATE OR REPLACE FUNCTION atualizar_status_po_recebimento()
RETURNS TRIGGER AS $$
DECLARE
  v_total_pedido    NUMERIC;
  v_total_recebido  NUMERIC;
BEGIN
  SELECT SUM(quantidade) INTO v_total_pedido
  FROM itens_po WHERE pedido_id = NEW.pedido_id;

  SELECT SUM(quantidade_recebida) INTO v_total_recebido
  FROM itens_recebimento
  WHERE recebimento_id IN (
    SELECT id FROM recebimentos WHERE pedido_id = NEW.pedido_id
  );

  IF v_total_recebido >= v_total_pedido THEN
    UPDATE ordens_compra SET status = 'RECEBIDA' WHERE id = NEW.pedido_id;
    UPDATE recebimentos SET status = 'COMPLETO' WHERE id = NEW.id;
  ELSE
    UPDATE ordens_compra SET status = 'PARCIALMENTE_RECEBIDA' WHERE id = NEW.pedido_id;
    UPDATE recebimentos SET status = 'PARCIAL' WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_status_apos_recebimento
  AFTER INSERT ON recebimentos
  FOR EACH ROW EXECUTE FUNCTION atualizar_status_po_recebimento();

-- ==========================================
-- TABELA: notas_fiscais
-- ==========================================
CREATE TABLE notas_fiscais (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  pedido_id       UUID NOT NULL REFERENCES ordens_compra(id),
  recebimento_id  UUID UNIQUE REFERENCES recebimentos(id),
  numero          TEXT NOT NULL,
  serie           TEXT,
  chave_acesso    TEXT,
  emissao         DATE NOT NULL,
  valor_total     NUMERIC(15,2) NOT NULL,
  status          status_nf NOT NULL DEFAULT 'PENDENTE',
  xml_path        TEXT,
  pdf_path        TEXT,
  divergencias    JSONB,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notas_fiscais_tenant" ON notas_fiscais
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- TABELA: contratos
-- ==========================================
CREATE TABLE contratos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  fornecedor_id  UUID NOT NULL REFERENCES fornecedores(id),
  titulo         TEXT NOT NULL,
  numero         TEXT,
  valor_total    NUMERIC(15,2),
  inicio         DATE NOT NULL,
  fim            DATE NOT NULL,
  status         status_contrato NOT NULL DEFAULT 'ATIVO',
  renovacao_auto BOOLEAN NOT NULL DEFAULT FALSE,
  alerta_dias    INT NOT NULL DEFAULT 30,
  arquivo_path   TEXT,
  observacoes    TEXT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER contratos_updated_at
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_tenant" ON contratos
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- FUNCTION: 3-way matching (PO x NF-e x Recebimento)
-- ==========================================
CREATE OR REPLACE FUNCTION verificar_matching(
  p_pedido_id UUID,
  p_numero_nf TEXT,
  p_valor_nf NUMERIC,
  p_fornecedor_cnpj TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_po RECORD;
  v_recebimento RECORD;
  v_divergencias JSONB := '[]'::JSONB;
BEGIN
  -- Buscar PO
  SELECT po.*, f.cnpj as fornecedor_cnpj
  INTO v_po
  FROM ordens_compra po
  JOIN fornecedores f ON f.id = po.fornecedor_id
  WHERE po.id = p_pedido_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('erro', 'PO não encontrada');
  END IF;

  -- Verificar fornecedor
  IF v_po.fornecedor_cnpj <> p_fornecedor_cnpj THEN
    v_divergencias := v_divergencias || jsonb_build_object(
      'tipo', 'fornecedor',
      'esperado', v_po.fornecedor_cnpj,
      'recebido', p_fornecedor_cnpj
    );
  END IF;

  -- Verificar valor (tolerância de 1%)
  IF ABS(v_po.valor_total - p_valor_nf) > (v_po.valor_total * 0.01) THEN
    v_divergencias := v_divergencias || jsonb_build_object(
      'tipo', 'valor',
      'esperado', v_po.valor_total,
      'recebido', p_valor_nf
    );
  END IF;

  -- Buscar recebimento
  SELECT * INTO v_recebimento
  FROM recebimentos
  WHERE pedido_id = p_pedido_id
  ORDER BY criado_em DESC
  LIMIT 1;

  IF NOT FOUND THEN
    v_divergencias := v_divergencias || jsonb_build_object(
      'tipo', 'recebimento',
      'mensagem', 'Nenhum recebimento registrado para esta PO'
    );
  END IF;

  RETURN jsonb_build_object(
    'sucesso', true,
    'divergencias', v_divergencias
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- JOB: alertas de vencimento de contratos (pg_cron)
-- Roda todo dia às 08:00 (horário do Brasil = 11:00 UTC)
-- ==========================================
SELECT cron.schedule(
  'alertas-contratos-diarios',
  '0 11 * * *',
  $$
    UPDATE contratos
    SET status = 'VENCENDO'
    WHERE status = 'ATIVO'
      AND fim BETWEEN CURRENT_DATE AND CURRENT_DATE + alerta_dias;

    UPDATE contratos
    SET status = 'VENCIDO'
    WHERE status IN ('ATIVO', 'VENCENDO')
      AND fim < CURRENT_DATE;
  $$
);
