-- ==========================================
-- Pedidos de Compra (Purchase Orders)
-- ==========================================

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  numero TEXT NOT NULL,
  cotacao_id UUID REFERENCES cotacoes(id),
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN (
    'PENDENTE',
    'APROVADO',
    'ENVIADO',
    'CONFIRMADO',
    'EM_ENTREGA',
    'PARCIALMENTE_RECEBIDO',
    'RECEBIDO',
    'CANCELADO'
  )),
  valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  data_emissao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_entrega_prevista DATE,
  condicao_pagamento TEXT,
  observacoes TEXT,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, numero)
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(15,3) NOT NULL,
  valor_unitario NUMERIC(15,2) NOT NULL,
  prazo_entrega INT,
  quantidade_recebida NUMERIC(15,3) NOT NULL DEFAULT 0,
  observacoes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pedidos_tenant ON pedidos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fornecedor ON pedidos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cotacao ON pedidos(cotacao_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido ON itens_pedido(pedido_id);

-- RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

-- Policies para pedidos
DROP POLICY IF EXISTS "Usuários podem ver pedidos do seu tenant" ON pedidos;
CREATE POLICY "Usuários podem ver pedidos do seu tenant"
  ON pedidos FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem criar pedidos no seu tenant" ON pedidos;
CREATE POLICY "Usuários podem criar pedidos no seu tenant"
  ON pedidos FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem atualizar pedidos do seu tenant" ON pedidos;
CREATE POLICY "Usuários podem atualizar pedidos do seu tenant"
  ON pedidos FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Policies para itens_pedido
DROP POLICY IF EXISTS "Usuários podem ver itens via pedido" ON itens_pedido;
CREATE POLICY "Usuários podem ver itens via pedido"
  ON itens_pedido FOR SELECT
  TO authenticated
  USING (
    pedido_id IN (
      SELECT id FROM pedidos
      WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuários podem criar itens via pedido" ON itens_pedido;
CREATE POLICY "Usuários podem criar itens via pedido"
  ON itens_pedido FOR INSERT
  TO authenticated
  WITH CHECK (
    pedido_id IN (
      SELECT id FROM pedidos
      WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuários podem atualizar itens via pedido" ON itens_pedido;
CREATE POLICY "Usuários podem atualizar itens via pedido"
  ON itens_pedido FOR UPDATE
  TO authenticated
  USING (
    pedido_id IN (
      SELECT id FROM pedidos
      WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Permissões
GRANT ALL ON pedidos TO authenticated;
GRANT ALL ON itens_pedido TO authenticated;

-- Função para gerar número de pedido
CREATE OR REPLACE FUNCTION gerar_numero_pedido(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_ano INT;
  v_sequencia INT;
  v_numero TEXT;
BEGIN
  v_ano := EXTRACT(YEAR FROM NOW());

  -- Buscar próximo número da sequência do ano atual
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'PO-' || v_ano || '-(\d+)') AS INT)), 0) + 1
  INTO v_sequencia
  FROM pedidos
  WHERE tenant_id = p_tenant_id
    AND numero LIKE 'PO-' || v_ano || '-%';

  v_numero := 'PO-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');

  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-preencher número do pedido
CREATE OR REPLACE FUNCTION auto_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := gerar_numero_pedido(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_numero_pedido ON pedidos;
CREATE TRIGGER trg_auto_numero_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION auto_numero_pedido();

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION atualizar_timestamp_pedido()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualizar_timestamp_pedido ON pedidos;
CREATE TRIGGER trg_atualizar_timestamp_pedido
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp_pedido();

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Tabelas de pedidos criadas com sucesso';
END $$;
