-- ============================================
-- EXECUTAR NO SUPABASE SQL EDITOR - VERSÃO COMPLETA
-- ============================================
-- URL: https://supabase.com/dashboard/project/rmypzuhbfechbxuikyht/editor
--
-- Este arquivo inclui TUDO necessário, incluindo a função de trigger
-- ============================================

-- PARTE 0: Criar função de atualização automática de updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PARTE 1: Criar ENUM para tipos de template
CREATE TYPE tipo_template_email AS ENUM (
  'COTACAO_ENVIADA',
  'COTACAO_RESPONDIDA',
  'PEDIDO_CRIADO',
  'PEDIDO_APROVADO',
  'PEDIDO_CANCELADO',
  'ESTOQUE_BAIXO',
  'REQUISICAO_CRIADA',
  'REQUISICAO_APROVADA',
  'REQUISICAO_REJEITADA',
  'CONVITE_USUARIO',
  'BEM_VINDO',
  'FATURA_GERADA',
  'FATURA_VENCIDA',
  'ASSINATURA_CANCELADA'
);

-- PARTE 2: Criar tabela de templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identificação
  tipo tipo_template_email NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,

  -- Conteúdo do email
  assunto VARCHAR(500) NOT NULL,
  corpo_html TEXT NOT NULL,
  corpo_texto TEXT,

  -- Configuração
  ativo BOOLEAN DEFAULT TRUE,
  variaveis_disponiveis JSONB,

  -- Metadados
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id),
  atualizado_por UUID REFERENCES profiles(id),

  -- Constraint: apenas 1 template ativo por tipo por tenant
  CONSTRAINT uq_template_tipo_tenant UNIQUE (tenant_id, tipo)
);

-- PARTE 3: Criar índices
CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_tipo ON email_templates(tipo);
CREATE INDEX idx_email_templates_ativo ON email_templates(ativo);

-- PARTE 4: Habilitar RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- PARTE 5: Criar policies
CREATE POLICY email_templates_select ON email_templates
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY email_templates_insert ON email_templates
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY email_templates_update ON email_templates
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY email_templates_delete ON email_templates
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- PARTE 6: Criar trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCESSO! Tabela criada.
-- ============================================
-- Próximo passo: executar o arquivo
-- migrations/20260620000003_insert_default_templates.sql
-- ============================================
