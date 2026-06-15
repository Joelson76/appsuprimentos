-- ==========================================
-- PREFERÊNCIAS DE NOTIFICAÇÃO
-- Controle granular de notificações por usuário
-- ==========================================

-- ==========================================
-- 1. TABELA DE PREFERÊNCIAS
-- ==========================================
CREATE TABLE IF NOT EXISTS preferencias_notificacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Notificações de Requisições
  req_criada_email BOOLEAN DEFAULT true,
  req_aprovada_email BOOLEAN DEFAULT true,
  req_rejeitada_email BOOLEAN DEFAULT true,
  req_criada_push BOOLEAN DEFAULT true,
  req_aprovada_push BOOLEAN DEFAULT true,
  req_rejeitada_push BOOLEAN DEFAULT false,

  -- Notificações de Cotações
  cot_nova_email BOOLEAN DEFAULT true,
  cot_resposta_email BOOLEAN DEFAULT true,
  cot_vencendo_email BOOLEAN DEFAULT true,
  cot_nova_push BOOLEAN DEFAULT true,
  cot_resposta_push BOOLEAN DEFAULT true,
  cot_vencendo_push BOOLEAN DEFAULT false,

  -- Notificações de Pedidos
  po_criado_email BOOLEAN DEFAULT true,
  po_aprovado_email BOOLEAN DEFAULT true,
  po_enviado_email BOOLEAN DEFAULT true,
  po_recebido_email BOOLEAN DEFAULT true,
  po_criado_push BOOLEAN DEFAULT true,
  po_aprovado_push BOOLEAN DEFAULT false,
  po_enviado_push BOOLEAN DEFAULT false,
  po_recebido_push BOOLEAN DEFAULT true,

  -- Notificações de Contratos
  contrato_vencendo_email BOOLEAN DEFAULT true,
  contrato_vencido_email BOOLEAN DEFAULT true,
  contrato_vencendo_push BOOLEAN DEFAULT true,
  contrato_vencido_push BOOLEAN DEFAULT true,

  -- Notificações de Sistema
  assinatura_vencendo_email BOOLEAN DEFAULT true,
  assinatura_suspensa_email BOOLEAN DEFAULT true,
  limite_atingido_email BOOLEAN DEFAULT true,
  assinatura_vencendo_push BOOLEAN DEFAULT true,
  assinatura_suspensa_push BOOLEAN DEFAULT true,
  limite_atingido_push BOOLEAN DEFAULT false,

  -- Resumos periódicos
  resumo_diario_email BOOLEAN DEFAULT false,
  resumo_semanal_email BOOLEAN DEFAULT true,
  resumo_mensal_email BOOLEAN DEFAULT true,

  -- Horário para resumos (formato HH:MM)
  horario_resumo TIME DEFAULT '08:00:00',

  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, tenant_id)
);

CREATE INDEX idx_preferencias_user ON preferencias_notificacao(user_id);
CREATE INDEX idx_preferencias_tenant ON preferencias_notificacao(tenant_id);

-- ==========================================
-- 2. RLS
-- ==========================================
ALTER TABLE preferencias_notificacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "preferencias_own" ON preferencias_notificacao;
CREATE POLICY "preferencias_own" ON preferencias_notificacao
  FOR ALL USING (
    user_id = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- ==========================================
-- 3. FUNÇÃO: Criar preferências padrão
-- ==========================================
CREATE OR REPLACE FUNCTION criar_preferencias_padrao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO preferencias_notificacao (user_id, tenant_id)
  VALUES (NEW.id, NEW.tenant_id)
  ON CONFLICT (user_id, tenant_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: criar preferências ao criar profile
DROP TRIGGER IF EXISTS trigger_criar_preferencias ON profiles;
CREATE TRIGGER trigger_criar_preferencias
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION criar_preferencias_padrao();

-- ==========================================
-- 4. FUNÇÃO: Verificar se usuário aceita notificação
-- ==========================================
CREATE OR REPLACE FUNCTION usuario_aceita_notificacao(
  p_user_id UUID,
  p_tipo_notificacao TEXT,
  p_canal TEXT -- 'email' ou 'push'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_aceita BOOLEAN;
  v_campo TEXT;
BEGIN
  -- Construir nome do campo
  v_campo := p_tipo_notificacao || '_' || p_canal;

  -- Buscar preferência
  EXECUTE format('
    SELECT %I FROM preferencias_notificacao
    WHERE user_id = $1
  ', v_campo)
  INTO v_aceita
  USING p_user_id;

  -- Se não encontrou preferência, assume true (padrão)
  RETURN COALESCE(v_aceita, true);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. POPULAR PREFERÊNCIAS PARA USUÁRIOS EXISTENTES
-- ==========================================
INSERT INTO preferencias_notificacao (user_id, tenant_id)
SELECT id, tenant_id
FROM profiles
WHERE tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- ==========================================
-- 6. TRIGGER: Updated At
-- ==========================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS preferencias_updated_at ON preferencias_notificacao;
CREATE TRIGGER preferencias_updated_at
  BEFORE UPDATE ON preferencias_notificacao
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ==========================================
-- TESTE
-- ==========================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM preferencias_notificacao;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'PREFERÊNCIAS DE NOTIFICAÇÃO';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Tabela criada com sucesso';
  RAISE NOTICE '✅ % preferências existentes', v_count;
  RAISE NOTICE '✅ RLS habilitado';
  RAISE NOTICE '✅ Trigger de criação automática ativo';
  RAISE NOTICE '================================================';
END $$;
