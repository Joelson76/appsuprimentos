-- ==========================================
-- FEATURE 6: Aprovação por Alçada
-- ==========================================

-- Tabela de regras de alçada
CREATE TABLE regras_alcada (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  nome               TEXT NOT NULL,
  descricao          TEXT,
  tipo_documento     TEXT NOT NULL CHECK (tipo_documento IN ('REQUISICAO', 'COTACAO', 'PEDIDO')),

  -- Condições de ativação
  valor_minimo       NUMERIC(15,2),
  valor_maximo       NUMERIC(15,2),
  categoria_id       UUID REFERENCES categorias(id),
  centro_custo_id    UUID REFERENCES centros_custo(id),

  -- Aprovadores
  perfil_aprovador   perfil_usuario, -- GESTOR, ADMIN, etc
  aprovador_id       UUID REFERENCES profiles(id), -- Usuário específico
  ordem              INT NOT NULL DEFAULT 1, -- Ordem de aprovação (1, 2, 3...)
  aprovacao_paralela BOOLEAN DEFAULT false, -- true = pode aprovar junto, false = sequencial

  -- SLA
  prazo_horas        INT, -- Prazo em horas para aprovar
  ativa              BOOLEAN NOT NULL DEFAULT true,

  criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_regras_alcada_tipo ON regras_alcada(tenant_id, tipo_documento, ativa);
CREATE INDEX idx_regras_alcada_valor ON regras_alcada(tipo_documento, valor_minimo, valor_maximo);

ALTER TABLE regras_alcada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regras_alcada_tenant" ON regras_alcada
  FOR ALL
  USING (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID)
  WITH CHECK (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID);

-- Tabela de aprovações necessárias
CREATE TABLE aprovacoes (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  tipo_documento     TEXT NOT NULL CHECK (tipo_documento IN ('REQUISICAO', 'COTACAO', 'PEDIDO')),
  documento_id       UUID NOT NULL, -- ID da requisição/cotação/pedido

  regra_alcada_id    UUID REFERENCES regras_alcada(id),
  ordem              INT NOT NULL, -- Ordem desta aprovação
  aprovacao_paralela BOOLEAN DEFAULT false,

  -- Aprovador
  perfil_requerido   perfil_usuario,
  aprovador_id       UUID REFERENCES profiles(id),

  -- Status
  status             TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO', 'DELEGADO', 'EXPIRADO')),

  aprovado_por       UUID REFERENCES profiles(id),
  aprovado_em        TIMESTAMPTZ,
  justificativa      TEXT,

  -- SLA
  prazo_ate          TIMESTAMPTZ,
  alertado_em        TIMESTAMPTZ,

  criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aprovacoes_documento ON aprovacoes(tipo_documento, documento_id);
CREATE INDEX idx_aprovacoes_pendentes ON aprovacoes(tenant_id, status, aprovador_id) WHERE status = 'PENDENTE';
CREATE INDEX idx_aprovacoes_prazo ON aprovacoes(status, prazo_ate) WHERE status = 'PENDENTE';

ALTER TABLE aprovacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aprovacoes_tenant" ON aprovacoes
  FOR ALL
  USING (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID)
  WITH CHECK (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID);

-- Função para criar aprovações baseadas nas regras
CREATE OR REPLACE FUNCTION criar_aprovacoes_necessarias(
  p_tipo_documento TEXT,
  p_documento_id UUID,
  p_valor_total NUMERIC,
  p_categoria_id UUID DEFAULT NULL,
  p_centro_custo_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_tenant_id UUID;
  v_regra RECORD;
  v_prazo_ate TIMESTAMPTZ;
BEGIN
  -- Pega tenant_id baseado no tipo de documento
  CASE p_tipo_documento
    WHEN 'REQUISICAO' THEN
      SELECT tenant_id INTO v_tenant_id FROM requisicoes WHERE id = p_documento_id;
    WHEN 'COTACAO' THEN
      SELECT tenant_id INTO v_tenant_id FROM cotacoes WHERE id = p_documento_id;
    WHEN 'PEDIDO' THEN
      SELECT tenant_id INTO v_tenant_id FROM ordens_compra WHERE id = p_documento_id;
  END CASE;

  -- Busca regras aplicáveis
  FOR v_regra IN
    SELECT *
    FROM regras_alcada
    WHERE tenant_id = v_tenant_id
      AND tipo_documento = p_tipo_documento
      AND ativa = true
      AND (valor_minimo IS NULL OR p_valor_total >= valor_minimo)
      AND (valor_maximo IS NULL OR p_valor_total <= valor_maximo)
      AND (categoria_id IS NULL OR categoria_id = p_categoria_id)
      AND (centro_custo_id IS NULL OR centro_custo_id = p_centro_custo_id)
    ORDER BY ordem
  LOOP
    -- Calcula prazo
    IF v_regra.prazo_horas IS NOT NULL THEN
      v_prazo_ate := NOW() + (v_regra.prazo_horas || ' hours')::INTERVAL;
    ELSE
      v_prazo_ate := NULL;
    END IF;

    -- Cria aprovação
    INSERT INTO aprovacoes (
      tenant_id, tipo_documento, documento_id,
      regra_alcada_id, ordem, aprovacao_paralela,
      perfil_requerido, aprovador_id,
      prazo_ate
    ) VALUES (
      v_tenant_id, p_tipo_documento, p_documento_id,
      v_regra.id, v_regra.ordem, v_regra.aprovacao_paralela,
      v_regra.perfil_aprovador, v_regra.aprovador_id,
      v_prazo_ate
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se pode aprovar
CREATE OR REPLACE FUNCTION pode_aprovar_documento(
  p_aprovacao_id UUID,
  p_usuario_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_aprovacao RECORD;
  v_usuario_perfil perfil_usuario;
  v_aprovacoes_anteriores_pendentes INT;
BEGIN
  -- Busca aprovação
  SELECT * INTO v_aprovacao
  FROM aprovacoes
  WHERE id = p_aprovacao_id;

  -- Busca perfil do usuário
  SELECT perfil INTO v_usuario_perfil
  FROM profiles
  WHERE id = p_usuario_id;

  -- Aprovação não existe ou já foi resolvida
  IF v_aprovacao IS NULL OR v_aprovacao.status != 'PENDENTE' THEN
    RETURN false;
  END IF;

  -- Verifica se é aprovador específico
  IF v_aprovacao.aprovador_id IS NOT NULL THEN
    RETURN v_aprovacao.aprovador_id = p_usuario_id;
  END IF;

  -- Verifica se tem perfil necessário
  IF v_aprovacao.perfil_requerido IS NOT NULL THEN
    IF v_usuario_perfil != v_aprovacao.perfil_requerido THEN
      RETURN false;
    END IF;
  END IF;

  -- Se não é paralela, verifica se aprovações anteriores foram concluídas
  IF NOT v_aprovacao.aprovacao_paralela THEN
    SELECT COUNT(*) INTO v_aprovacoes_anteriores_pendentes
    FROM aprovacoes
    WHERE tipo_documento = v_aprovacao.tipo_documento
      AND documento_id = v_aprovacao.documento_id
      AND ordem < v_aprovacao.ordem
      AND status = 'PENDENTE';

    IF v_aprovacoes_anteriores_pendentes > 0 THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para aprovar/rejeitar
CREATE OR REPLACE FUNCTION processar_aprovacao(
  p_aprovacao_id UUID,
  p_usuario_id UUID,
  p_acao TEXT, -- 'APROVAR' ou 'REJEITAR'
  p_justificativa TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_aprovacao RECORD;
  v_pode_aprovar BOOLEAN;
  v_todas_aprovadas BOOLEAN;
BEGIN
  -- Verifica se pode aprovar
  v_pode_aprovar := pode_aprovar_documento(p_aprovacao_id, p_usuario_id);

  IF NOT v_pode_aprovar THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Você não tem permissão para aprovar este documento'
    );
  END IF;

  -- Atualiza status da aprovação
  UPDATE aprovacoes
  SET status = CASE WHEN p_acao = 'APROVAR' THEN 'APROVADO' ELSE 'REJEITADO' END,
      aprovado_por = p_usuario_id,
      aprovado_em = NOW(),
      justificativa = p_justificativa
  WHERE id = p_aprovacao_id
  RETURNING * INTO v_aprovacao;

  -- Se foi rejeitado, rejeita todas as outras aprovações pendentes
  IF p_acao = 'REJEITAR' THEN
    UPDATE aprovacoes
    SET status = 'REJEITADO',
        aprovado_por = p_usuario_id,
        aprovado_em = NOW(),
        justificativa = 'Rejeitado em cadeia'
    WHERE tipo_documento = v_aprovacao.tipo_documento
      AND documento_id = v_aprovacao.documento_id
      AND status = 'PENDENTE'
      AND id != p_aprovacao_id;

    -- Atualiza status do documento
    CASE v_aprovacao.tipo_documento
      WHEN 'REQUISICAO' THEN
        UPDATE requisicoes SET status = 'REJEITADA' WHERE id = v_aprovacao.documento_id;
      WHEN 'COTACAO' THEN
        UPDATE cotacoes SET status = 'REJEITADA' WHERE id = v_aprovacao.documento_id;
      WHEN 'PEDIDO' THEN
        UPDATE ordens_compra SET status = 'CANCELADA' WHERE id = v_aprovacao.documento_id;
    END CASE;

    RETURN jsonb_build_object('success', true, 'status', 'REJEITADO');
  END IF;

  -- Se foi aprovado, verifica se todas as aprovações foram concluídas
  SELECT COUNT(*) = 0 INTO v_todas_aprovadas
  FROM aprovacoes
  WHERE tipo_documento = v_aprovacao.tipo_documento
    AND documento_id = v_aprovacao.documento_id
    AND status = 'PENDENTE';

  IF v_todas_aprovadas THEN
    -- Atualiza status do documento para APROVADA
    CASE v_aprovacao.tipo_documento
      WHEN 'REQUISICAO' THEN
        UPDATE requisicoes SET status = 'APROVADA' WHERE id = v_aprovacao.documento_id;
      WHEN 'COTACAO' THEN
        UPDATE cotacoes SET status = 'APROVADA' WHERE id = v_aprovacao.documento_id;
      WHEN 'PEDIDO' THEN
        UPDATE ordens_compra SET status = 'CONFIRMADA' WHERE id = v_aprovacao.documento_id;
    END CASE;

    RETURN jsonb_build_object('success', true, 'status', 'TOTALMENTE_APROVADO');
  END IF;

  RETURN jsonb_build_object('success', true, 'status', 'APROVACAO_PARCIAL');
END;
$$ LANGUAGE plpgsql;

-- View de aprovações pendentes com informações completas
CREATE OR REPLACE VIEW vw_aprovacoes_pendentes AS
SELECT
  a.id,
  a.tenant_id,
  a.tipo_documento,
  a.documento_id,
  a.ordem,
  a.status,
  a.prazo_ate,
  a.criado_em,
  CASE
    WHEN a.prazo_ate IS NOT NULL AND a.prazo_ate < NOW() THEN true
    ELSE false
  END as em_atraso,
  r.nome as regra_nome,
  a.perfil_requerido,
  a.aprovador_id,
  pa.nome as aprovador_nome,
  -- Informações do documento
  CASE a.tipo_documento
    WHEN 'REQUISICAO' THEN req.numero
    WHEN 'COTACAO' THEN cot.numero
    WHEN 'PEDIDO' THEN oc.numero
  END as documento_numero,
  CASE a.tipo_documento
    WHEN 'PEDIDO' THEN oc.valor_total
    ELSE NULL
  END as documento_valor,
  ps.nome as solicitante_nome
FROM aprovacoes a
LEFT JOIN regras_alcada r ON r.id = a.regra_alcada_id
LEFT JOIN profiles pa ON pa.id = a.aprovador_id
LEFT JOIN requisicoes req ON req.id = a.documento_id AND a.tipo_documento = 'REQUISICAO'
LEFT JOIN cotacoes cot ON cot.id = a.documento_id AND a.tipo_documento = 'COTACAO'
LEFT JOIN ordens_compra oc ON oc.id = a.documento_id AND a.tipo_documento = 'PEDIDO'
LEFT JOIN requisicoes req_cot ON req_cot.id = cot.requisicao_id
LEFT JOIN requisicoes req_oc ON req_oc.id = oc.requisicao_id
LEFT JOIN profiles ps ON ps.id = COALESCE(
  req.solicitante_id,
  req_cot.solicitante_id,
  req_oc.solicitante_id
)
WHERE a.status = 'PENDENTE';
-- ==========================================
-- FEATURE 4: Import NF-e XML
-- ==========================================

-- Tabela para armazenar XMLs importados
CREATE TABLE nfe_importadas (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  nota_fiscal_id     UUID REFERENCES notas_fiscais(id),

  -- Dados do XML
  chave_acesso       TEXT NOT NULL UNIQUE,
  numero_nfe         TEXT NOT NULL,
  serie              TEXT,
  data_emissao       DATE NOT NULL,
  data_entrada       DATE,

  -- Fornecedor
  fornecedor_id      UUID REFERENCES fornecedores(id),
  fornecedor_cnpj    TEXT NOT NULL,
  fornecedor_nome    TEXT NOT NULL,

  -- Valores
  valor_produtos     NUMERIC(15,2) NOT NULL,
  valor_total        NUMERIC(15,2) NOT NULL,
  valor_icms         NUMERIC(15,2),
  valor_ipi          NUMERIC(15,2),

  -- XML completo
  xml_content        TEXT NOT NULL,
  xml_hash           TEXT NOT NULL, -- SHA256 do XML

  -- Itens parseados (JSONB)
  itens              JSONB NOT NULL,

  -- Status
  status             TEXT NOT NULL DEFAULT 'IMPORTADO' CHECK (status IN ('IMPORTADO', 'PROCESSADO', 'ERRO', 'DUPLICADO')),
  erro_msg           TEXT,

  importado_por      UUID NOT NULL REFERENCES profiles(id),
  importado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processado_em      TIMESTAMPTZ
);

CREATE INDEX idx_nfe_importadas_chave ON nfe_importadas(chave_acesso);
CREATE INDEX idx_nfe_importadas_fornecedor ON nfe_importadas(tenant_id, fornecedor_id);
CREATE INDEX idx_nfe_importadas_status ON nfe_importadas(tenant_id, status);

ALTER TABLE nfe_importadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfe_importadas_tenant" ON nfe_importadas
  FOR ALL
  USING (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID)
  WITH CHECK (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID);

-- Função para processar XML importado
CREATE OR REPLACE FUNCTION processar_nfe_importada(
  p_nfe_importada_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_nfe RECORD;
  v_fornecedor_id UUID;
  v_nota_fiscal_id UUID;
  v_pedido_vinculado UUID;
  v_produto_id UUID;
  v_item JSONB;
BEGIN
  -- Busca NF-e importada
  SELECT * INTO v_nfe FROM nfe_importadas WHERE id = p_nfe_importada_id;

  IF v_nfe IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NF-e não encontrada');
  END IF;

  -- Busca ou cria fornecedor
  SELECT id INTO v_fornecedor_id
  FROM fornecedores
  WHERE tenant_id = v_nfe.tenant_id
    AND cnpj = v_nfe.fornecedor_cnpj;

  IF v_fornecedor_id IS NULL THEN
    -- Cria fornecedor novo
    INSERT INTO fornecedores (
      tenant_id, razao_social, cnpj, status
    ) VALUES (
      v_nfe.tenant_id, v_nfe.fornecedor_nome, v_nfe.fornecedor_cnpj, 'EM_HOMOLOGACAO'
    )
    RETURNING id INTO v_fornecedor_id;
  END IF;

  -- Atualiza fornecedor_id na importação
  UPDATE nfe_importadas
  SET fornecedor_id = v_fornecedor_id
  WHERE id = p_nfe_importada_id;

  -- Cria nota fiscal
  INSERT INTO notas_fiscais (
    tenant_id, fornecedor_id, numero, serie,
    chave_acesso, data_emissao, data_entrada,
    valor_total, tipo, status, arquivo_url
  ) VALUES (
    v_nfe.tenant_id, v_fornecedor_id, v_nfe.numero_nfe, v_nfe.serie,
    v_nfe.chave_acesso, v_nfe.data_emissao, COALESCE(v_nfe.data_entrada, CURRENT_DATE),
    v_nfe.valor_total, 'ENTRADA', 'PROCESSADA', NULL
  )
  RETURNING id INTO v_nota_fiscal_id;

  -- Vincula nota à importação
  UPDATE nfe_importadas
  SET nota_fiscal_id = v_nota_fiscal_id,
      status = 'PROCESSADO',
      processado_em = NOW()
  WHERE id = p_nfe_importada_id;

  -- Processa itens (tenta vincular a produtos existentes)
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_nfe.itens)
  LOOP
    -- Tenta encontrar produto por código
    SELECT id INTO v_produto_id
    FROM produtos
    WHERE tenant_id = v_nfe.tenant_id
      AND (
        codigo = v_item->>'codigo'
        OR descricao ILIKE '%' || (v_item->>'descricao') || '%'
      )
    LIMIT 1;

    -- Aqui você pode criar itens da NF se necessário
    -- (depende se sua tabela notas_fiscais tem tabela de itens)
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'nota_fiscal_id', v_nota_fiscal_id,
    'fornecedor_id', v_fornecedor_id
  );

EXCEPTION
  WHEN OTHERS THEN
    UPDATE nfe_importadas
    SET status = 'ERRO',
        erro_msg = SQLERRM
    WHERE id = p_nfe_importada_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- View de resumo de importações
CREATE OR REPLACE VIEW vw_nfe_resumo AS
SELECT
  n.id,
  n.tenant_id,
  n.chave_acesso,
  n.numero_nfe,
  n.serie,
  n.data_emissao,
  n.fornecedor_nome,
  n.fornecedor_cnpj,
  f.razao_social as fornecedor_cadastrado,
  n.valor_total,
  n.status,
  n.importado_em,
  p.nome as importado_por_nome,
  jsonb_array_length(n.itens) as qtd_itens
FROM nfe_importadas n
LEFT JOIN fornecedores f ON f.id = n.fornecedor_id
LEFT JOIN profiles p ON p.id = n.importado_por
ORDER BY n.importado_em DESC;
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
  AVG(oc.prazo_entrega - oc.criado_em::DATE)::NUMERIC(10,1) as lead_time_medio_dias,
  MIN(oc.prazo_entrega - oc.criado_em::DATE) as lead_time_minimo,
  MAX(oc.prazo_entrega - oc.criado_em::DATE) as lead_time_maximo
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
