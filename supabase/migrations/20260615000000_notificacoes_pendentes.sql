-- Adicionar colunas faltantes na tabela notificacoes_pendentes
-- (a tabela já existe, criada em fase4)

-- Adicionar colunas se não existirem
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

-- Habilitar RLS (idempotente)
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
