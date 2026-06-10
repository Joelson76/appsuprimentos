-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE status_fornecedor AS ENUM (
  'ATIVO', 'INATIVO', 'BLOQUEADO', 'EM_HOMOLOGACAO'
);

CREATE TYPE urgencia_tipo AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'CRITICA');

CREATE TYPE status_requisicao AS ENUM (
  'RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADA',
  'REPROVADA', 'EM_COTACAO', 'PEDIDO_GERADO', 'CANCELADA'
);

CREATE TYPE status_po AS ENUM (
  'RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADA',
  'ENVIADA_FORNECEDOR', 'CONFIRMADA', 'EM_TRANSITO',
  'PARCIALMENTE_RECEBIDA', 'RECEBIDA', 'FATURADA', 'CANCELADA'
);

CREATE TYPE status_cotacao AS ENUM (
  'ABERTA', 'AGUARDANDO_RESPOSTAS', 'ENCERRADA', 'CANCELADA'
);

CREATE TYPE tipo_aprovacao AS ENUM ('REQUISICAO', 'PO', 'CONTRATO');

CREATE TYPE status_aprovacao AS ENUM (
  'PENDENTE', 'APROVADO', 'REPROVADO', 'DELEGADO'
);

-- ==========================================
-- TABELA: fornecedores
-- ==========================================
CREATE TABLE fornecedores (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  razao_social           TEXT NOT NULL,
  nome_fantasia          TEXT,
  cnpj                   TEXT NOT NULL,
  email                  TEXT,
  telefone               TEXT,
  endereco               JSONB,
  categorias             TEXT[] DEFAULT '{}',
  status                 status_fornecedor NOT NULL DEFAULT 'EM_HOMOLOGACAO',
  prazo_medio_pagamento  INT,
  score                  NUMERIC(3,1) DEFAULT 0,
  criado_em              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cnpj, tenant_id)
);

CREATE TRIGGER fornecedores_updated_at
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fornecedores_tenant" ON fornecedores
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- TABELA: categorias (hierárquica)
-- ==========================================
CREATE TABLE categorias (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  nome      TEXT NOT NULL,
  codigo    TEXT,
  pai_id    UUID REFERENCES categorias(id)
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias_tenant" ON categorias
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- TABELA: centros_custo
-- ==========================================
CREATE TABLE centros_custo (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  nome      TEXT NOT NULL,
  codigo    TEXT NOT NULL,
  orcamento NUMERIC(15,2)
);

ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "centros_custo_tenant" ON centros_custo
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- FUNÇÃO: numeração automática por tenant
-- ==========================================
CREATE TABLE sequencias_numeracao (
  tenant_id UUID NOT NULL,
  prefixo   TEXT NOT NULL,
  ano       INT  NOT NULL,
  ultimo    INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, prefixo, ano)
);

CREATE OR REPLACE FUNCTION proximo_numero(p_tenant_id UUID, p_prefixo TEXT)
RETURNS TEXT AS $$
DECLARE
  v_ano  INT := EXTRACT(YEAR FROM NOW());
  v_num  INT;
BEGIN
  INSERT INTO sequencias_numeracao (tenant_id, prefixo, ano, ultimo)
  VALUES (p_tenant_id, p_prefixo, v_ano, 1)
  ON CONFLICT (tenant_id, prefixo, ano)
  DO UPDATE SET ultimo = sequencias_numeracao.ultimo + 1
  RETURNING ultimo INTO v_num;

  RETURN p_prefixo || '-' || v_ano || '-' || LPAD(v_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TABELA: requisicoes
-- ==========================================
CREATE TABLE requisicoes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  numero           TEXT NOT NULL,
  solicitante_id   UUID NOT NULL REFERENCES profiles(id),
  centro_custo_id  UUID REFERENCES centros_custo(id),
  status           status_requisicao NOT NULL DEFAULT 'RASCUNHO',
  urgencia         urgencia_tipo NOT NULL DEFAULT 'NORMAL',
  descricao        TEXT,
  data_necessidade DATE,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(numero, tenant_id)
);

CREATE TRIGGER requisicoes_updated_at
  BEFORE UPDATE ON requisicoes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger para gerar número automaticamente
CREATE OR REPLACE FUNCTION gerar_numero_requisicao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero := proximo_numero(NEW.tenant_id, 'REQ');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requisicao_numero
  BEFORE INSERT ON requisicoes
  FOR EACH ROW EXECUTE FUNCTION gerar_numero_requisicao();

ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requisicoes_tenant" ON requisicoes
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- TABELA: itens_requisicao
-- ==========================================
CREATE TABLE itens_requisicao (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requisicao_id UUID NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
  descricao     TEXT NOT NULL,
  quantidade    NUMERIC(15,3) NOT NULL,
  unidade       TEXT NOT NULL,
  valor_estimado NUMERIC(15,2),
  categoria_id  UUID REFERENCES categorias(id)
);

ALTER TABLE itens_requisicao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itens_req_tenant" ON itens_requisicao
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM requisicoes r
      WHERE r.id = requisicao_id
      AND r.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    )
  );

-- ==========================================
-- TABELA: regras_aprovacao
-- ==========================================
CREATE TABLE regras_aprovacao (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  tipo         tipo_aprovacao NOT NULL,
  nivel        INT NOT NULL DEFAULT 1,
  aprovador_id UUID NOT NULL REFERENCES profiles(id),
  valor_minimo NUMERIC(15,2),
  valor_maximo NUMERIC(15,2),
  ativo        BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE regras_aprovacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regras_aprovacao_tenant" ON regras_aprovacao
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- TABELA: aprovacoes
-- ==========================================
CREATE TABLE aprovacoes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  tipo           tipo_aprovacao NOT NULL,
  referencia_id  UUID NOT NULL,
  aprovador_id   UUID NOT NULL REFERENCES profiles(id),
  status         status_aprovacao NOT NULL DEFAULT 'PENDENTE',
  nivel          INT NOT NULL DEFAULT 1,
  comentario     TEXT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  respondido_em  TIMESTAMPTZ
);

ALTER TABLE aprovacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aprovacoes_tenant" ON aprovacoes
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- TABELA: cotacoes
-- ==========================================
CREATE TABLE cotacoes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  numero        TEXT NOT NULL,
  requisicao_id UUID REFERENCES requisicoes(id),
  status        status_cotacao NOT NULL DEFAULT 'ABERTA',
  data_limite   TIMESTAMPTZ NOT NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(numero, tenant_id)
);

CREATE OR REPLACE FUNCTION gerar_numero_cotacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero := proximo_numero(NEW.tenant_id, 'COT');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cotacao_numero
  BEFORE INSERT ON cotacoes
  FOR EACH ROW EXECUTE FUNCTION gerar_numero_cotacao();

ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cotacoes_tenant" ON cotacoes
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- TABELA: itens_cotacao
-- ==========================================
CREATE TABLE itens_cotacao (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cotacao_id         UUID NOT NULL REFERENCES cotacoes(id) ON DELETE CASCADE,
  fornecedor_id      UUID NOT NULL REFERENCES fornecedores(id),
  descricao          TEXT NOT NULL,
  quantidade         NUMERIC(15,3) NOT NULL,
  valor_unitario     NUMERIC(15,2),
  prazo_entrega      INT,
  condicao_pagamento TEXT,
  vencedor           BOOLEAN NOT NULL DEFAULT FALSE,
  token_resposta     TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex')
);

-- Sem RLS direto — acessado via token público nas rotas de cotação
-- Internamente protegido via cotacoes (tenant_id)

-- ==========================================
-- TABELA: ordens_compra
-- ==========================================
CREATE TABLE ordens_compra (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  numero             TEXT NOT NULL,
  requisicao_id      UUID REFERENCES requisicoes(id),
  fornecedor_id      UUID NOT NULL REFERENCES fornecedores(id),
  status             status_po NOT NULL DEFAULT 'RASCUNHO',
  valor_total        NUMERIC(15,2) NOT NULL DEFAULT 0,
  prazo_entrega      DATE,
  condicao_pagamento TEXT,
  observacoes        TEXT,
  criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(numero, tenant_id)
);

CREATE OR REPLACE FUNCTION gerar_numero_po()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero := proximo_numero(NEW.tenant_id, 'PO');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_numero
  BEFORE INSERT ON ordens_compra
  FOR EACH ROW EXECUTE FUNCTION gerar_numero_po();

CREATE TRIGGER ordens_compra_updated_at
  BEFORE UPDATE ON ordens_compra
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE ordens_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ordens_compra_tenant" ON ordens_compra
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- TABELA: itens_po
-- ==========================================
CREATE TABLE itens_po (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id      UUID NOT NULL REFERENCES ordens_compra(id) ON DELETE CASCADE,
  descricao      TEXT NOT NULL,
  quantidade     NUMERIC(15,3) NOT NULL,
  unidade        TEXT NOT NULL,
  valor_unitario NUMERIC(15,2) NOT NULL,
  valor_total    NUMERIC(15,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED
);

ALTER TABLE itens_po ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itens_po_tenant" ON itens_po
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ordens_compra oc
      WHERE oc.id = pedido_id
      AND oc.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    )
  );

-- ==========================================
-- TABELA: avaliacoes_fornecedor
-- ==========================================
CREATE TABLE avaliacoes_fornecedor (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),
  pedido_id     UUID REFERENCES ordens_compra(id),
  prazo         SMALLINT NOT NULL CHECK (prazo BETWEEN 1 AND 5),
  qualidade     SMALLINT NOT NULL CHECK (qualidade BETWEEN 1 AND 5),
  preco         SMALLINT NOT NULL CHECK (preco BETWEEN 1 AND 5),
  atendimento   SMALLINT NOT NULL CHECK (atendimento BETWEEN 1 AND 5),
  comentario    TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: recalcular score do fornecedor após nova avaliação
CREATE OR REPLACE FUNCTION recalcular_score_fornecedor()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fornecedores SET score = (
    SELECT ROUND(
      (AVG(prazo) * 0.3 + AVG(qualidade) * 0.4 + AVG(preco) * 0.2 + AVG(atendimento) * 0.1) * 2,
      1
    )
    FROM avaliacoes_fornecedor
    WHERE fornecedor_id = NEW.fornecedor_id
  )
  WHERE id = NEW.fornecedor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_score_fornecedor
  AFTER INSERT ON avaliacoes_fornecedor
  FOR EACH ROW EXECUTE FUNCTION recalcular_score_fornecedor();

ALTER TABLE avaliacoes_fornecedor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avaliacoes_fornecedor_tenant" ON avaliacoes_fornecedor
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fornecedores f
      WHERE f.id = fornecedor_id
      AND f.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    )
  );

-- ==========================================
-- STORED PROCEDURE: aprovar_requisicao
-- ==========================================
CREATE OR REPLACE FUNCTION aprovar_requisicao(
  p_aprovacao_id UUID,
  p_comentario   TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_aprovacao    RECORD;
  v_proximo_nivel INT;
BEGIN
  -- Buscar aprovação e verificar que pertence ao usuário logado
  SELECT * INTO v_aprovacao FROM aprovacoes
  WHERE id = p_aprovacao_id
    AND aprovador_id = auth.uid()
    AND status = 'PENDENTE';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aprovação não encontrada ou não pertence ao usuário';
  END IF;

  -- Marcar aprovação como aprovada
  UPDATE aprovacoes SET status = 'APROVADO', comentario = p_comentario,
    respondido_em = NOW() WHERE id = p_aprovacao_id;

  -- Verificar se há próximo nível
  SELECT MIN(nivel) INTO v_proximo_nivel
  FROM regras_aprovacao
  WHERE tenant_id = v_aprovacao.tenant_id
    AND tipo = v_aprovacao.tipo
    AND nivel > v_aprovacao.nivel
    AND ativo = TRUE;

  IF v_proximo_nivel IS NOT NULL THEN
    -- Criar aprovações do próximo nível
    INSERT INTO aprovacoes (tenant_id, tipo, referencia_id, aprovador_id, nivel)
    SELECT v_aprovacao.tenant_id, v_aprovacao.tipo, v_aprovacao.referencia_id,
           aprovador_id, v_proximo_nivel
    FROM regras_aprovacao
    WHERE tenant_id = v_aprovacao.tenant_id
      AND tipo = v_aprovacao.tipo
      AND nivel = v_proximo_nivel
      AND ativo = TRUE;
  ELSE
    -- Último nível aprovado: atualizar status da requisição ou PO
    IF v_aprovacao.tipo = 'REQUISICAO' THEN
      UPDATE requisicoes SET status = 'APROVADA' WHERE id = v_aprovacao.referencia_id;
    ELSIF v_aprovacao.tipo = 'PO' THEN
      UPDATE ordens_compra SET status = 'APROVADA' WHERE id = v_aprovacao.referencia_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('sucesso', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- STORED PROCEDURE: reprovar_requisicao
-- ==========================================
CREATE OR REPLACE FUNCTION reprovar_requisicao(
  p_aprovacao_id UUID,
  p_comentario   TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_aprovacao RECORD;
BEGIN
  SELECT * INTO v_aprovacao FROM aprovacoes
  WHERE id = p_aprovacao_id
    AND aprovador_id = auth.uid()
    AND status = 'PENDENTE';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aprovação não encontrada ou não pertence ao usuário';
  END IF;

  UPDATE aprovacoes SET status = 'REPROVADO', comentario = p_comentario,
    respondido_em = NOW() WHERE id = p_aprovacao_id;

  IF v_aprovacao.tipo = 'REQUISICAO' THEN
    UPDATE requisicoes SET status = 'REPROVADA' WHERE id = v_aprovacao.referencia_id;
  ELSIF v_aprovacao.tipo = 'PO' THEN
    UPDATE ordens_compra SET status = 'CANCELADA' WHERE id = v_aprovacao.referencia_id;
  END IF;

  RETURN jsonb_build_object('sucesso', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
