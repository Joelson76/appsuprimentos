-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE status_assinatura AS ENUM (
  'TRIAL', 'ATIVA', 'INADIMPLENTE', 'CANCELADA', 'SUSPENSA'
);

CREATE TYPE status_pagamento AS ENUM (
  'PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO', 'ESTORNADO'
);

-- ==========================================
-- TABELA: planos
-- ==========================================
CREATE TABLE planos (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  preco_centavos       INT NOT NULL,
  limite_usuarios      INT NOT NULL,
  limite_pos_mes       INT NOT NULL,
  limite_storage_mb    INT NOT NULL,
  funcionalidades      TEXT[] NOT NULL DEFAULT '{}',
  ativo                BOOLEAN NOT NULL DEFAULT TRUE,
  ordem                INT NOT NULL DEFAULT 0
);

-- Seed dos planos
INSERT INTO planos (nome, slug, preco_centavos, limite_usuarios, limite_pos_mes,
                    limite_storage_mb, funcionalidades, ordem)
VALUES
  ('Básico', 'basico', 29900, 10, 500, 1024,
   ARRAY['requisicoes','pedidos','fornecedores','aprovacoes',
         'recebimento','notas_fiscais','relatorios_basicos'], 1),
  ('Profissional', 'profissional', 79900, 50, 5000, 10240,
   ARRAY['requisicoes','pedidos','fornecedores','aprovacoes',
         'recebimento','notas_fiscais','cotacoes','contratos',
         'estoque','relatorios_avancados','api_access'], 2),
  ('Enterprise', 'enterprise', 0, -1, -1, -1,
   ARRAY['tudo'], 3);

-- ==========================================
-- TABELA: assinaturas
-- ==========================================
CREATE TABLE assinaturas (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL UNIQUE REFERENCES tenants(id),
  plano_id              UUID NOT NULL REFERENCES planos(id),
  status                status_assinatura NOT NULL DEFAULT 'TRIAL',
  trial_inicio          TIMESTAMPTZ,
  trial_fim             TIMESTAMPTZ,
  periodo_inicio        TIMESTAMPTZ,
  periodo_fim           TIMESTAMPTZ,
  asaas_customer_id     TEXT,
  asaas_subscription_id TEXT,
  cancelado_em          TIMESTAMPTZ,
  motivo_cancelamento   TEXT,
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER assinaturas_updated_at
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assinaturas_tenant" ON assinaturas
  FOR ALL USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- ==========================================
-- TABELA: pagamentos
-- ==========================================
CREATE TABLE pagamentos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assinatura_id     UUID NOT NULL REFERENCES assinaturas(id),
  asaas_payment_id  TEXT UNIQUE,
  valor             NUMERIC(10,2) NOT NULL,
  vencimento        DATE NOT NULL,
  status            status_pagamento NOT NULL DEFAULT 'PENDENTE',
  metodo_pagamento  TEXT,
  link_pagamento    TEXT,
  pix_copia_cola    TEXT,
  pdf_boleto        TEXT,
  pago_em           TIMESTAMPTZ,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pagamentos_tenant" ON pagamentos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assinaturas a
      WHERE a.id = assinatura_id
      AND (
        a.tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
        OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
      )
    )
  );

-- ==========================================
-- TABELA: uso_tenants (contador em tempo real)
-- ==========================================
CREATE TABLE uso_tenants (
  tenant_id          UUID PRIMARY KEY REFERENCES tenants(id),
  usuarios_ativos    INT NOT NULL DEFAULT 0,
  pos_mes            INT NOT NULL DEFAULT 0,
  pos_mes_reset      DATE NOT NULL DEFAULT CURRENT_DATE,
  storage_mb         NUMERIC(10,2) NOT NULL DEFAULT 0,
  atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: atualizar contador de POs ao criar uma nova
CREATE OR REPLACE FUNCTION incrementar_pos_mes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO uso_tenants (tenant_id, pos_mes)
  VALUES (NEW.tenant_id, 1)
  ON CONFLICT (tenant_id)
  DO UPDATE SET pos_mes = uso_tenants.pos_mes + 1,
                atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_incrementa_uso
  AFTER INSERT ON ordens_compra
  FOR EACH ROW EXECUTE FUNCTION incrementar_pos_mes();

-- ==========================================
-- FUNÇÃO: verificar limite do plano antes de criar recurso
-- ==========================================
CREATE OR REPLACE FUNCTION verificar_limite_plano(p_recurso TEXT)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID := ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID);
  v_assinatura RECORD;
  v_uso        RECORD;
BEGIN
  SELECT a.status, a.trial_fim, p.limite_usuarios,
         p.limite_pos_mes, p.limite_storage_mb
  INTO v_assinatura
  FROM assinaturas a JOIN planos p ON p.id = a.plano_id
  WHERE a.tenant_id = v_tenant_id;

  IF v_assinatura.status IN ('SUSPENSA', 'CANCELADA') THEN
    RETURN jsonb_build_object(
      'permitido', false,
      'motivo', 'Assinatura inativa. Acesse Configurações > Assinatura.'
    );
  END IF;

  IF v_assinatura.status = 'TRIAL' AND NOW() > v_assinatura.trial_fim THEN
    RETURN jsonb_build_object(
      'permitido', false,
      'motivo', 'Período trial encerrado. Escolha um plano para continuar.'
    );
  END IF;

  SELECT * INTO v_uso FROM uso_tenants WHERE tenant_id = v_tenant_id;

  IF p_recurso = 'usuario' AND v_assinatura.limite_usuarios <> -1
     AND v_uso.usuarios_ativos >= v_assinatura.limite_usuarios THEN
    RETURN jsonb_build_object(
      'permitido', false,
      'motivo', format('Limite de %s usuários atingido.', v_assinatura.limite_usuarios)
    );
  END IF;

  IF p_recurso = 'po' AND v_assinatura.limite_pos_mes <> -1
     AND v_uso.pos_mes >= v_assinatura.limite_pos_mes THEN
    RETURN jsonb_build_object(
      'permitido', false,
      'motivo', format('Limite de %s POs/mês atingido.', v_assinatura.limite_pos_mes)
    );
  END IF;

  RETURN jsonb_build_object('permitido', true);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==========================================
-- FUNÇÃO: métricas SaaS globais (SUPER_ADMIN)
-- ==========================================
CREATE OR REPLACE FUNCTION metricas_saas_globais()
RETURNS JSONB AS $$
SELECT jsonb_build_object(
  'mrr', COALESCE(SUM(CASE WHEN a.status = 'ATIVA' THEN p.preco_centavos ELSE 0 END) / 100.0, 0),
  'total_tenants', COUNT(*),
  'tenants_ativos', COUNT(CASE WHEN a.status = 'ATIVA' THEN 1 END),
  'tenants_trial', COUNT(CASE WHEN a.status = 'TRIAL' THEN 1 END),
  'tenants_suspensos', COUNT(CASE WHEN a.status = 'SUSPENSA' THEN 1 END),
  'novos_mes', COUNT(CASE WHEN DATE_TRUNC('month', t.criado_em) = DATE_TRUNC('month', NOW()) THEN 1 END)
)
FROM tenants t
LEFT JOIN assinaturas a ON a.tenant_id = t.id
LEFT JOIN planos p ON p.id = a.plano_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ==========================================
-- TRIGGER: criar assinatura trial ao criar tenant
-- ==========================================
CREATE OR REPLACE FUNCTION criar_assinatura_trial()
RETURNS TRIGGER AS $$
DECLARE
  v_plano_basico UUID;
BEGIN
  SELECT id INTO v_plano_basico FROM planos WHERE slug = 'basico' LIMIT 1;

  INSERT INTO assinaturas (
    tenant_id, plano_id, status,
    trial_inicio, trial_fim
  ) VALUES (
    NEW.id, v_plano_basico, 'TRIAL',
    NOW(), NOW() + INTERVAL '14 days'
  );

  INSERT INTO uso_tenants (tenant_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_cria_assinatura
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION criar_assinatura_trial();

-- ==========================================
-- JOBS pg_cron: trial e reset mensal
-- ==========================================

-- Verificar trial diariamente às 09:00 BRT (12:00 UTC)
SELECT cron.schedule(
  'verificar-trial-diario',
  '0 12 * * *',
  $$
    UPDATE assinaturas
    SET status = 'SUSPENSA'
    WHERE status = 'TRIAL'
      AND trial_fim < NOW();

    INSERT INTO notificacoes_pendentes (tenant_id, tipo, payload)
    SELECT tenant_id, 'TRIAL_EXPIRANDO',
      jsonb_build_object('dias_restantes',
        EXTRACT(DAY FROM trial_fim - NOW())::INT)
    FROM assinaturas
    WHERE status = 'TRIAL'
      AND trial_fim BETWEEN NOW() AND NOW() + INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM notificacoes_pendentes np
        WHERE np.tenant_id = assinaturas.tenant_id
          AND np.tipo = 'TRIAL_EXPIRANDO'
          AND DATE_TRUNC('day', np.criado_em) = CURRENT_DATE
      );
  $$
);

-- Reset do contador de POs no dia 1 de cada mês
SELECT cron.schedule(
  'reset-pos-mensais',
  '0 0 1 * *',
  $$
    UPDATE uso_tenants
    SET pos_mes = 0,
        pos_mes_reset = CURRENT_DATE,
        atualizado_em = NOW();
  $$
);
