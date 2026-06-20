-- Migration: Criar tabela de templates de email
-- Data: 2026-06-20

-- Criar enum para tipos de template
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

-- Criar tabela de templates
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
  variaveis_disponiveis JSONB, -- Lista de variáveis que podem ser usadas (ex: {empresa_nome}, {valor_total})

  -- Metadados
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id),
  atualizado_por UUID REFERENCES profiles(id),

  -- Constraint: apenas 1 template ativo por tipo por tenant
  CONSTRAINT uq_template_tipo_tenant UNIQUE (tenant_id, tipo)
);

-- Índices
CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_tipo ON email_templates(tipo);
CREATE INDEX idx_email_templates_ativo ON email_templates(ativo);

-- RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT
CREATE POLICY email_templates_select ON email_templates
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: INSERT
CREATE POLICY email_templates_insert ON email_templates
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Policy: UPDATE
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

-- Policy: DELETE
CREATE POLICY email_templates_delete ON email_templates
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE email_templates IS 'Templates de e-mail personalizáveis por tenant';
COMMENT ON COLUMN email_templates.tipo IS 'Tipo/finalidade do template (enum)';
COMMENT ON COLUMN email_templates.variaveis_disponiveis IS 'JSON com lista de variáveis disponíveis para substituição no template';
COMMENT ON COLUMN email_templates.corpo_html IS 'Corpo do email em HTML (suporta variáveis como {{nome_empresa}})';
COMMENT ON COLUMN email_templates.corpo_texto IS 'Versão em texto puro (fallback)';

-- Inserir templates padrão (exemplo)
-- Estes serão criados via código para cada tenant no primeiro acesso
