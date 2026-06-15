-- ==========================================
-- FEATURE 1: Histórico de Preços por Produto/Fornecedor
-- ==========================================

-- Tabela para registrar histórico de preços
CREATE TABLE historico_precos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  produto_id      UUID REFERENCES produtos(id),
  fornecedor_id   UUID NOT NULL REFERENCES fornecedores(id),
  descricao_item  TEXT NOT NULL, -- Caso não seja produto cadastrado
  preco_unitario  NUMERIC(15,2) NOT NULL,
  moeda           TEXT NOT NULL DEFAULT 'BRL',

  -- Origem da informação
  cotacao_id      UUID REFERENCES cotacoes(id),
  pedido_id       UUID REFERENCES ordens_compra(id),

  quantidade      NUMERIC(15,3),
  unidade         TEXT,
  prazo_entrega   INT, -- dias

  registrado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historico_precos_produto ON historico_precos(produto_id, fornecedor_id);
CREATE INDEX idx_historico_precos_fornecedor ON historico_precos(fornecedor_id, registrado_em DESC);
CREATE INDEX idx_historico_precos_tenant ON historico_precos(tenant_id);

ALTER TABLE historico_precos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historico_precos_tenant" ON historico_precos
  FOR ALL
  USING (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID)
  WITH CHECK (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID);

-- View para comparação rápida de preços
CREATE OR REPLACE VIEW vw_comparativo_precos AS
SELECT
  hp.tenant_id,
  hp.produto_id,
  p.descricao as produto_descricao,
  hp.fornecedor_id,
  f.razao_social as fornecedor_nome,
  hp.preco_unitario,
  hp.quantidade,
  hp.unidade,
  hp.prazo_entrega,
  hp.registrado_em,
  ROW_NUMBER() OVER (
    PARTITION BY hp.produto_id, hp.fornecedor_id
    ORDER BY hp.registrado_em DESC
  ) as ranking_recente
FROM historico_precos hp
LEFT JOIN produtos p ON p.id = hp.produto_id
JOIN fornecedores f ON f.id = hp.fornecedor_id;

-- Função para registrar automaticamente preço quando cotação vencedora é selecionada
CREATE OR REPLACE FUNCTION registrar_historico_preco_cotacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vencedor = TRUE AND (OLD IS NULL OR OLD.vencedor = FALSE) THEN
    INSERT INTO historico_precos (
      tenant_id, fornecedor_id, descricao_item,
      preco_unitario, quantidade, cotacao_id, prazo_entrega
    )
    SELECT
      (SELECT tenant_id FROM cotacoes WHERE id = NEW.cotacao_id),
      NEW.fornecedor_id,
      NEW.descricao,
      NEW.valor_unitario,
      NEW.quantidade,
      NEW.cotacao_id,
      NEW.prazo_entrega
    WHERE NEW.valor_unitario IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_historico_preco_cotacao
  AFTER INSERT OR UPDATE ON itens_cotacao
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_preco_cotacao();

-- Função para registrar automaticamente preço quando pedido é criado
CREATE OR REPLACE FUNCTION registrar_historico_preco_pedido()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO historico_precos (
    tenant_id, fornecedor_id, descricao_item,
    preco_unitario, quantidade, pedido_id
  )
  SELECT
    NEW.tenant_id,
    NEW.fornecedor_id,
    ip.descricao,
    ip.valor_unitario,
    ip.quantidade,
    NEW.id
  FROM itens_po ip
  WHERE ip.pedido_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_historico_preco_pedido
  AFTER INSERT ON ordens_compra
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_preco_pedido();
