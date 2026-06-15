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
    WHEN 'REQUISICAO' THEN req.valor_total
    WHEN 'COTACAO' THEN cot.valor_total
    WHEN 'PEDIDO' THEN oc.valor_total
  END as documento_valor,
  ps.nome as solicitante_nome
FROM aprovacoes a
LEFT JOIN regras_alcada r ON r.id = a.regra_alcada_id
LEFT JOIN profiles pa ON pa.id = a.aprovador_id
LEFT JOIN requisicoes req ON req.id = a.documento_id AND a.tipo_documento = 'REQUISICAO'
LEFT JOIN cotacoes cot ON cot.id = a.documento_id AND a.tipo_documento = 'COTACAO'
LEFT JOIN ordens_compra oc ON oc.id = a.documento_id AND a.tipo_documento = 'PEDIDO'
LEFT JOIN profiles ps ON ps.id = COALESCE(req.solicitante_id, cot.criado_por, oc.criado_por)
WHERE a.status = 'PENDENTE';
