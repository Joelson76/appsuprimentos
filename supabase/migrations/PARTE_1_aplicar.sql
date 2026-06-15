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

-- Função para registrar automaticamente preço quando cotação é aprovada
CREATE OR REPLACE FUNCTION registrar_historico_preco_cotacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APROVADA' AND OLD.status != 'APROVADA' THEN
    -- Insere histórico para cada item da cotação aprovada
    INSERT INTO historico_precos (
      tenant_id, produto_id, fornecedor_id, descricao_item,
      preco_unitario, quantidade, unidade, cotacao_id, prazo_entrega
    )
    SELECT
      NEW.tenant_id,
      ci.produto_id,
      NEW.fornecedor_id,
      COALESCE(p.descricao, ci.descricao),
      ci.preco_unitario,
      ci.quantidade,
      ci.unidade,
      NEW.id,
      NEW.prazo_entrega
    FROM cotacoes_itens ci
    LEFT JOIN produtos p ON p.id = ci.produto_id
    WHERE ci.cotacao_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_historico_preco_cotacao
  AFTER UPDATE ON cotacoes
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_preco_cotacao();

-- Função para registrar automaticamente preço quando pedido é criado
CREATE OR REPLACE FUNCTION registrar_historico_preco_pedido()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO historico_precos (
    tenant_id, produto_id, fornecedor_id, descricao_item,
    preco_unitario, quantidade, unidade, pedido_id
  )
  SELECT
    NEW.tenant_id,
    oi.produto_id,
    NEW.fornecedor_id,
    COALESCE(p.descricao, oi.descricao),
    oi.preco_unitario,
    oi.quantidade,
    oi.unidade,
    NEW.id
  FROM ordens_itens oi
  LEFT JOIN produtos p ON p.id = oi.produto_id
  WHERE oi.ordem_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_historico_preco_pedido
  AFTER INSERT ON ordens_compra
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_preco_pedido();
-- ==========================================
-- FEATURE 2: Alertas de Reposição Automática
-- ==========================================

-- Tabela de alertas de estoque
CREATE TABLE alertas_estoque (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  produto_id       UUID NOT NULL REFERENCES produtos(id),
  tipo             TEXT NOT NULL CHECK (tipo IN ('ESTOQUE_MINIMO', 'RUPTURA', 'EXCESSO')),
  estoque_atual    NUMERIC(15,3) NOT NULL,
  estoque_minimo   NUMERIC(15,3),
  estoque_maximo   NUMERIC(15,3),
  prioridade       TEXT NOT NULL DEFAULT 'MEDIA' CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
  status           TEXT NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'EM_REPOSICAO', 'RESOLVIDO', 'IGNORADO')),
  requisicao_id    UUID REFERENCES requisicoes(id),
  resolvido_em     TIMESTAMPTZ,
  resolvido_por    UUID REFERENCES profiles(id),
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alertas_estoque_produto ON alertas_estoque(produto_id);
CREATE INDEX idx_alertas_estoque_status ON alertas_estoque(tenant_id, status, prioridade);
CREATE INDEX idx_alertas_estoque_criado ON alertas_estoque(tenant_id, criado_em DESC);

ALTER TABLE alertas_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas_estoque_tenant" ON alertas_estoque
  FOR ALL
  USING (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID)
  WITH CHECK (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID);

-- Função para gerar alertas automaticamente
CREATE OR REPLACE FUNCTION verificar_alertas_estoque()
RETURNS TRIGGER AS $$
DECLARE
  v_alerta_existente UUID;
  v_prioridade TEXT;
BEGIN
  -- Só processa se tem estoque_minimo_alerta configurado
  IF NEW.estoque_minimo_alerta IS NOT NULL THEN

    -- Determina prioridade
    IF NEW.estoque_atual = 0 THEN
      v_prioridade := 'CRITICA'; -- Ruptura total
    ELSIF NEW.estoque_atual < (NEW.estoque_minimo_alerta * 0.5) THEN
      v_prioridade := 'ALTA'; -- Menos de 50% do mínimo
    ELSIF NEW.estoque_atual < NEW.estoque_minimo_alerta THEN
      v_prioridade := 'MEDIA'; -- Abaixo do mínimo
    ELSE
      v_prioridade := NULL; -- Tudo OK
    END IF;

    -- Se está abaixo do mínimo
    IF v_prioridade IS NOT NULL THEN
      -- Verifica se já existe alerta ABERTO para este produto
      SELECT id INTO v_alerta_existente
      FROM alertas_estoque
      WHERE produto_id = NEW.id
        AND status = 'ABERTO'
      LIMIT 1;

      -- Se não existe, cria novo alerta
      IF v_alerta_existente IS NULL THEN
        INSERT INTO alertas_estoque (
          tenant_id, produto_id, tipo, estoque_atual,
          estoque_minimo, prioridade
        ) VALUES (
          NEW.tenant_id,
          NEW.id,
          CASE WHEN NEW.estoque_atual = 0 THEN 'RUPTURA' ELSE 'ESTOQUE_MINIMO' END,
          NEW.estoque_atual,
          NEW.estoque_minimo_alerta,
          v_prioridade
        );
      ELSE
        -- Atualiza alerta existente com novo estoque
        UPDATE alertas_estoque
        SET estoque_atual = NEW.estoque_atual,
            prioridade = v_prioridade,
            atualizado_em = NOW()
        WHERE id = v_alerta_existente;
      END IF;

    ELSE
      -- Estoque normalizado - resolver alertas abertos
      UPDATE alertas_estoque
      SET status = 'RESOLVIDO',
          resolvido_em = NOW()
      WHERE produto_id = NEW.id
        AND status = 'ABERTO';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alertas_estoque
  AFTER UPDATE OF estoque_atual ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION verificar_alertas_estoque();

-- View consolidada de produtos críticos
CREATE OR REPLACE VIEW vw_produtos_criticos AS
SELECT
  p.id as produto_id,
  p.tenant_id,
  p.descricao,
  p.codigo,
  p.estoque_atual,
  p.estoque_minimo_alerta,
  p.unidade,
  c.nome as categoria,
  a.id as alerta_id,
  a.prioridade,
  a.tipo as tipo_alerta,
  a.criado_em as alerta_desde,
  CASE
    WHEN p.estoque_atual = 0 THEN 'RUPTURA'
    WHEN p.estoque_atual < p.estoque_minimo_alerta * 0.5 THEN 'CRÍTICO'
    WHEN p.estoque_atual < p.estoque_minimo_alerta THEN 'BAIXO'
    ELSE 'NORMAL'
  END as nivel_estoque
FROM produtos p
LEFT JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN alertas_estoque a ON a.produto_id = p.id AND a.status = 'ABERTO'
WHERE p.ativo = true
  AND p.estoque_minimo_alerta IS NOT NULL
  AND p.estoque_atual <= p.estoque_minimo_alerta
ORDER BY
  CASE a.prioridade
    WHEN 'CRITICA' THEN 1
    WHEN 'ALTA' THEN 2
    WHEN 'MEDIA' THEN 3
    ELSE 4
  END,
  p.estoque_atual ASC;
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
