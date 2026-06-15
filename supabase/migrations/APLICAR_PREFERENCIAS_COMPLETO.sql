-- ==========================================
-- PREFERÊNCIAS DE NOTIFICAÇÃO - COMPLETO
-- Aplique este arquivo no Supabase SQL Editor
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

CREATE INDEX IF NOT EXISTS idx_preferencias_user ON preferencias_notificacao(user_id);
CREATE INDEX IF NOT EXISTS idx_preferencias_tenant ON preferencias_notificacao(tenant_id);

-- ==========================================
-- 2. RLS
-- ==========================================
ALTER TABLE preferencias_notificacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "preferencias_own" ON preferencias_notificacao;
DROP POLICY IF EXISTS "preferencias_insert" ON preferencias_notificacao;
DROP POLICY IF EXISTS "preferencias_select" ON preferencias_notificacao;
DROP POLICY IF EXISTS "preferencias_update" ON preferencias_notificacao;
DROP POLICY IF EXISTS "preferencias_delete" ON preferencias_notificacao;

-- Policy para INSERT
CREATE POLICY "preferencias_insert" ON preferencias_notificacao
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy para SELECT
CREATE POLICY "preferencias_select" ON preferencias_notificacao
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- Policy para UPDATE
CREATE POLICY "preferencias_update" ON preferencias_notificacao
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy para DELETE
CREATE POLICY "preferencias_delete" ON preferencias_notificacao
  FOR DELETE
  USING (user_id = auth.uid());

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
-- 4. TRIGGER: Updated At
-- ==========================================
DROP TRIGGER IF EXISTS preferencias_updated_at ON preferencias_notificacao;
CREATE TRIGGER preferencias_updated_at
  BEFORE UPDATE ON preferencias_notificacao
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ==========================================
-- 5. POPULAR PREFERÊNCIAS PARA USUÁRIOS EXISTENTES
-- ==========================================
INSERT INTO preferencias_notificacao (user_id, tenant_id)
SELECT id, tenant_id
FROM profiles
WHERE tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- ==========================================
-- TESTE
-- ==========================================
DO $$
DECLARE
  v_count INTEGER;
  v_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM preferencias_notificacao;
  SELECT COUNT(*) INTO v_policies FROM pg_policies WHERE tablename = 'preferencias_notificacao';

  RAISE NOTICE '================================================';
  RAISE NOTICE 'PREFERÊNCIAS DE NOTIFICAÇÃO';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Tabela criada com sucesso';
  RAISE NOTICE '✅ % preferências criadas', v_count;
  RAISE NOTICE '✅ RLS habilitado com % policies', v_policies;
  RAISE NOTICE '✅ Trigger de criação automática ativo';
  RAISE NOTICE '================================================';
END $$;
