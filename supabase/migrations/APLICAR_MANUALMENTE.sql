-- ==========================================
-- APLICAR ESTAS MIGRATIONS MANUALMENTE NO SUPABASE
-- Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql
-- ==========================================

-- 1. Adicionar colunas na tabela notificacoes_pendentes
-- (Migration: 20260615000000_notificacoes_pendentes.sql)
-- ==========================================

DO $$
BEGIN
  -- Adicionar tentativas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notificacoes_pendentes' AND column_name = 'tentativas'
  ) THEN
    ALTER TABLE notificacoes_pendentes ADD COLUMN tentativas INT NOT NULL DEFAULT 0;
  END IF;

  -- Adicionar erro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notificacoes_pendentes' AND column_name = 'erro'
  ) THEN
    ALTER TABLE notificacoes_pendentes ADD COLUMN erro TEXT;
  END IF;

  -- Adicionar enviado_em
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notificacoes_pendentes' AND column_name = 'enviado_em'
  ) THEN
    ALTER TABLE notificacoes_pendentes ADD COLUMN enviado_em TIMESTAMPTZ;
  END IF;
END $$;

-- Adicionar foreign key no tenant_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notificacoes_pendentes_tenant_id_fkey'
  ) THEN
    ALTER TABLE notificacoes_pendentes
      ADD CONSTRAINT notificacoes_pendentes_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_notificacoes_pendentes_tenant ON notificacoes_pendentes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_pendentes_enviado ON notificacoes_pendentes(enviado);
CREATE INDEX IF NOT EXISTS idx_notificacoes_pendentes_tipo ON notificacoes_pendentes(tipo);

-- Habilitar RLS
ALTER TABLE notificacoes_pendentes ENABLE ROW LEVEL SECURITY;

-- Dropar policy antiga se existir e recriar
DROP POLICY IF EXISTS "notificacoes_pendentes_tenant" ON notificacoes_pendentes;

CREATE POLICY "notificacoes_pendentes_tenant" ON notificacoes_pendentes
  FOR ALL USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- Comentários
COMMENT ON TABLE notificacoes_pendentes IS 'Fila de notificações pendentes (e-mails, webhooks, etc)';
COMMENT ON COLUMN notificacoes_pendentes.tipo IS 'Tipo da notificação: TRIAL_EXPIRANDO, PAGAMENTO_VENCIDO, ASSINATURA_ATIVADA, etc';
COMMENT ON COLUMN notificacoes_pendentes.payload IS 'Dados específicos da notificação em JSON';
COMMENT ON COLUMN notificacoes_pendentes.tentativas IS 'Número de tentativas de envio';
COMMENT ON COLUMN notificacoes_pendentes.erro IS 'Última mensagem de erro ao tentar enviar';
COMMENT ON COLUMN notificacoes_pendentes.enviado_em IS 'Data/hora em que foi enviada com sucesso';


-- ==========================================
-- 2. Permitir leitura dos planos (público e autenticado)
-- (Migration: 20260615000001_planos_public.sql)
-- ==========================================

-- Habilitar RLS na tabela planos
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "planos_public_read" ON planos;
DROP POLICY IF EXISTS "planos_authenticated_read" ON planos;

-- Policy para permitir SELECT público (sem autenticação)
CREATE POLICY "planos_public_read" ON planos
  FOR SELECT
  USING (ativo = true);

-- Policy para usuários autenticados (garante acesso interno)
CREATE POLICY "planos_authenticated_read" ON planos
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE planos IS 'Planos de assinatura disponíveis no SaaS';
