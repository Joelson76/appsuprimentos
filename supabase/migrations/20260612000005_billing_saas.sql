-- ==========================================
-- MÓDULO: Pagamentos e Billing SaaS
-- ==========================================
-- Gestão de assinaturas, cobranças e integração com Asaas
-- ==========================================

-- ENUMS
CREATE TYPE forma_pagamento AS ENUM (
  'PIX', 'BOLETO', 'CARTAO_CREDITO', 'CARTAO_DEBITO'
);

CREATE TYPE tipo_plano AS ENUM (
  'BASICO', 'PROFISSIONAL', 'ENTERPRISE'
);

-- ==========================================
-- TABELA: assinaturas
-- ==========================================
CREATE TABLE assinaturas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL UNIQUE REFERENCES tenants(id),
  plano             tipo_plano NOT NULL DEFAULT 'BASICO',
  valor_mensal      NUMERIC(10,2) NOT NULL,
  dia_vencimento    INT NOT NULL DEFAULT 5 CHECK (dia_vencimento BETWEEN 1 AND 28),
  forma_pagamento   forma_pagamento,
  ativa             BOOLEAN NOT NULL DEFAULT TRUE,
  asaas_customer_id TEXT,
  asaas_subscription_id TEXT,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER assinaturas_updated_at
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assinaturas_tenant" ON assinaturas
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- ==========================================
-- TABELA: faturas
-- ==========================================
CREATE TABLE faturas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  assinatura_id     UUID NOT NULL REFERENCES assinaturas(id),

  -- Dados da fatura
  numero            TEXT NOT NULL,
  valor             NUMERIC(10,2) NOT NULL,
  vencimento        DATE NOT NULL,
  pagamento_em      DATE,

  -- Status
  status            status_pagamento NOT NULL DEFAULT 'PENDENTE',

  -- Integração Asaas
  asaas_payment_id  TEXT,
  asaas_invoice_url TEXT,
  linha_digitavel   TEXT,
  qr_code_pix       TEXT,
  qr_code_pix_url   TEXT,

  -- Observações
  descricao         TEXT,
  observacoes       TEXT,

  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER faturas_updated_at
  BEFORE UPDATE ON faturas
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faturas_tenant" ON faturas
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Índices para performance
CREATE INDEX idx_faturas_tenant ON faturas(tenant_id);
CREATE INDEX idx_faturas_status ON faturas(status);
CREATE INDEX idx_faturas_vencimento ON faturas(vencimento);
CREATE INDEX idx_faturas_asaas ON faturas(asaas_payment_id);

-- ==========================================
-- TABELA: historico_planos
-- ==========================================
CREATE TABLE historico_planos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  plano_antigo  tipo_plano,
  plano_novo    tipo_plano NOT NULL,
  valor_antigo  NUMERIC(10,2),
  valor_novo    NUMERIC(10,2) NOT NULL,
  motivo        TEXT,
  usuario_id    UUID REFERENCES profiles(id),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE historico_planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "historico_planos_tenant" ON historico_planos
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- ==========================================
-- FUNÇÃO: Gerar número de fatura
-- ==========================================
CREATE OR REPLACE FUNCTION gerar_numero_fatura(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_ano TEXT;
  v_mes TEXT;
  v_seq INT;
  v_numero TEXT;
BEGIN
  v_ano := TO_CHAR(NOW(), 'YYYY');
  v_mes := TO_CHAR(NOW(), 'MM');

  -- Contar faturas do mês
  SELECT COUNT(*) + 1 INTO v_seq
  FROM faturas
  WHERE tenant_id = p_tenant_id
    AND TO_CHAR(criado_em, 'YYYY-MM') = v_ano || '-' || v_mes;

  v_numero := 'FAT-' || v_ano || v_mes || '-' || LPAD(v_seq::TEXT, 4, '0');

  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- FUNÇÃO: Bloquear tenant por inadimplência
-- ==========================================
CREATE OR REPLACE FUNCTION verificar_inadimplencia()
RETURNS void AS $$
BEGIN
  -- Bloquear tenants com faturas vencidas há mais de 7 dias
  UPDATE tenants
  SET status = 'BLOQUEADO'
  WHERE id IN (
    SELECT DISTINCT tenant_id
    FROM faturas
    WHERE status IN ('PENDENTE', 'VENCIDO')
      AND vencimento < CURRENT_DATE - INTERVAL '7 days'
  )
  AND status != 'BLOQUEADO';

  RAISE NOTICE 'Verificação de inadimplência concluída';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- FUNÇÃO: Gerar fatura mensal
-- ==========================================
CREATE OR REPLACE FUNCTION gerar_faturas_mensais()
RETURNS void AS $$
DECLARE
  v_assinatura RECORD;
  v_numero TEXT;
  v_vencimento DATE;
BEGIN
  FOR v_assinatura IN
    SELECT * FROM assinaturas WHERE ativa = true
  LOOP
    -- Calcular próximo vencimento
    v_vencimento := DATE_TRUNC('month', CURRENT_DATE) +
                    INTERVAL '1 month' +
                    (v_assinatura.dia_vencimento - 1 || ' days')::INTERVAL;

    -- Verificar se já existe fatura para este mês
    IF NOT EXISTS (
      SELECT 1 FROM faturas
      WHERE assinatura_id = v_assinatura.id
        AND TO_CHAR(vencimento, 'YYYY-MM') = TO_CHAR(v_vencimento, 'YYYY-MM')
    ) THEN
      -- Gerar número
      v_numero := gerar_numero_fatura(v_assinatura.tenant_id);

      -- Criar fatura
      INSERT INTO faturas (
        tenant_id,
        assinatura_id,
        numero,
        valor,
        vencimento,
        status,
        descricao
      ) VALUES (
        v_assinatura.tenant_id,
        v_assinatura.id,
        v_numero,
        v_assinatura.valor_mensal,
        v_vencimento,
        'PENDENTE',
        'Mensalidade ' || TO_CHAR(v_vencimento, 'MM/YYYY')
      );

      RAISE NOTICE 'Fatura % gerada para tenant %', v_numero, v_assinatura.tenant_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- DADOS INICIAIS: Tabela de preços
-- ==========================================
-- Esta tabela armazena os preços dos planos
CREATE TABLE planos_precos (
  plano         tipo_plano PRIMARY KEY,
  nome          TEXT NOT NULL,
  valor_mensal  NUMERIC(10,2) NOT NULL,
  max_usuarios  INT,
  descricao     TEXT,
  recursos      JSONB
);

INSERT INTO planos_precos (plano, nome, valor_mensal, max_usuarios, descricao, recursos) VALUES
('BASICO', 'Básico', 99.90, 5, 'Ideal para pequenas empresas',
  '["5 usuários", "Requisições ilimitadas", "Cotações ilimitadas", "Suporte por email"]'::JSONB),
('PROFISSIONAL', 'Profissional', 249.90, 20, 'Para empresas em crescimento',
  '["20 usuários", "Todos recursos do Básico", "Gestão de contratos", "Gestão de estoque", "Suporte prioritário"]'::JSONB),
('ENTERPRISE', 'Enterprise', 599.90, NULL, 'Para grandes empresas',
  '["Usuários ilimitados", "Todos recursos", "API dedicada", "Suporte 24/7", "Gerente de conta"]'::JSONB);

-- Permissões
GRANT SELECT ON planos_precos TO authenticated;
GRANT SELECT ON planos_precos TO anon;

-- ==========================================
-- TRIGGER: Registrar mudança de plano
-- ==========================================
CREATE OR REPLACE FUNCTION registrar_mudanca_plano()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.plano != NEW.plano THEN
    INSERT INTO historico_planos (
      tenant_id,
      plano_antigo,
      plano_novo,
      valor_antigo,
      valor_novo,
      motivo,
      usuario_id
    ) VALUES (
      NEW.tenant_id,
      OLD.plano,
      NEW.plano,
      OLD.valor_mensal,
      NEW.valor_mensal,
      'Alteração via sistema',
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mudanca_plano_assinatura
  AFTER UPDATE ON assinaturas
  FOR EACH ROW
  WHEN (OLD.plano IS DISTINCT FROM NEW.plano)
  EXECUTE FUNCTION registrar_mudanca_plano();

-- ==========================================
-- Permissões
-- ==========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON assinaturas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON faturas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON historico_planos TO authenticated;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Módulo de Pagamentos/Billing criado com sucesso!';
  RAISE NOTICE 'Tabelas: assinaturas, faturas, historico_planos, planos_precos';
  RAISE NOTICE 'Funções: gerar_faturas_mensais(), verificar_inadimplencia()';
END $$;
