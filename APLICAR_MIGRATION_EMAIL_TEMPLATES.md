# 📧 Migration: Sistema de Templates de E-mail

## ✅ O que foi criado:

### 1. **Tabela `email_templates`**
Armazena templates personalizáveis de e-mail por tenant com:
- 14 tipos de templates (cotações, pedidos, faturas, etc.)
- Sistema de variáveis dinâmicas `{{nome_variavel}}`
- Versões HTML e texto puro
- RLS completo (isolamento por tenant)
- Apenas 1 template ativo por tipo

### 2. **Página de Gerenciamento**
- `/configuracoes/templates-email` - Lista todos os templates
- Criar, editar, visualizar e ativar/desativar templates
- Preview em tempo real com dados de exemplo

### 3. **Componentes**
- `NovoTemplateDialog` - Criar templates com assistente
- `PreviewTemplateDialog` - Visualizar em 3 modos (HTML, código, texto)

---

## 🚀 Como Aplicar a Migration

### Passo 1: Acesse o Supabase SQL Editor

**URL**: https://supabase.com/dashboard/project/rmypzuhbfechbxuikyht/editor

### Passo 2: Execute o SQL

Copie e cole o conteúdo de `migrations/20260620000002_create_email_templates.sql`:

```sql
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
  
  tipo tipo_template_email NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  assunto VARCHAR(500) NOT NULL,
  corpo_html TEXT NOT NULL,
  corpo_texto TEXT,
  
  ativo BOOLEAN DEFAULT TRUE,
  variaveis_disponiveis JSONB,
  
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id),
  atualizado_por UUID REFERENCES profiles(id),
  
  CONSTRAINT uq_template_tipo_tenant UNIQUE (tenant_id, tipo)
);

-- Índices
CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_tipo ON email_templates(tipo);
CREATE INDEX idx_email_templates_ativo ON email_templates(ativo);

-- RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY email_templates_select ON email_templates
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY email_templates_insert ON email_templates
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid() AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY email_templates_update ON email_templates
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid() AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid() AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY email_templates_delete ON email_templates
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid() AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Passo 3: Clique em **RUN**

Aguarde a confirmação de sucesso!

---

## 🎯 Como Usar

### 1. Acesse a página de templates

**Localmente**: http://localhost:3000/configuracoes/templates-email  
**Produção**: https://appsuprimentos.vercel.app/configuracoes/templates-email

### 2. Crie seu primeiro template

Clique em **"Novo Template"** e escolha:
- **Tipo**: Ex: "Cotação Enviada"
- **Nome**: Ex: "Template Padrão de Cotação"
- **Assunto**: `Nova Cotação #{{numero_cotacao}} - {{nome_empresa}}`
- **Corpo HTML**:
```html
<h1>Olá, {{fornecedor_nome}}!</h1>
<p>Você recebeu uma nova solicitação de cotação da empresa <strong>{{nome_empresa}}</strong>.</p>

<h2>Detalhes da Cotação</h2>
<ul>
  <li>Número: {{numero_cotacao}}</li>
  <li>Total de itens: {{total_itens}}</li>
  <li>Prazo para resposta: {{prazo_resposta}}</li>
</ul>

<p>
  <a href="https://app.exemplo.com/cotacoes/{{numero_cotacao}}" 
     style="background: #667eea; color: white; padding: 12px 24px; 
            text-decoration: none; border-radius: 6px; display: inline-block;">
    Responder Cotação
  </a>
</p>

<p>Atenciosamente,<br>Equipe {{nome_empresa}}</p>
```

### 3. Visualize o Preview

Clique em **"Preview"** para ver como ficará com dados reais!

### 4. Ative o template

Templates ativos são usados automaticamente pelo sistema.

---

## 📋 Tipos de Templates Disponíveis

| Tipo | Quando é usado | Variáveis disponíveis |
|------|----------------|----------------------|
| **COTACAO_ENVIADA** | Ao enviar cotação para fornecedor | nome_empresa, numero_cotacao, fornecedor_nome, total_itens, prazo_resposta |
| **COTACAO_RESPONDIDA** | Fornecedor responde cotação | nome_empresa, numero_cotacao, fornecedor_nome |
| **PEDIDO_CRIADO** | Criar novo pedido de compra | nome_empresa, numero_pedido, fornecedor_nome, valor_total, prazo_entrega |
| **PEDIDO_APROVADO** | Pedido aprovado | nome_empresa, numero_pedido, valor_total |
| **PEDIDO_CANCELADO** | Pedido cancelado | nome_empresa, numero_pedido, motivo |
| **ESTOQUE_BAIXO** | Alerta de estoque mínimo | nome_empresa, produto_nome, estoque_atual, estoque_minimo |
| **REQUISICAO_CRIADA** | Nova requisição interna | nome_empresa, numero_requisicao, solicitante_nome, total_itens |
| **REQUISICAO_APROVADA** | Requisição aprovada | nome_empresa, numero_requisicao |
| **REQUISICAO_REJEITADA** | Requisição rejeitada | nome_empresa, numero_requisicao, motivo |
| **CONVITE_USUARIO** | Convidar novo usuário | nome_empresa, usuario_nome, link_aceite, perfil |
| **BEM_VINDO** | Boas-vindas após cadastro | nome_empresa, usuario_nome, email |
| **FATURA_GERADA** | Nova fatura de assinatura | nome_empresa, valor, vencimento, link_pagamento |
| **FATURA_VENCIDA** | Fatura atrasada | nome_empresa, valor, vencimento, dias_atraso |
| **ASSINATURA_CANCELADA** | Assinatura foi cancelada | nome_empresa, plano, data_cancelamento |

---

## 🔧 Como o Sistema Usa os Templates

### No código, ao enviar um email:

```typescript
import { enviarEmailComTemplate } from '@/lib/email-service'

// Enviar cotação
await enviarEmailComTemplate({
  tipo: 'COTACAO_ENVIADA',
  para: 'fornecedor@exemplo.com',
  variaveis: {
    nome_empresa: 'Minha Empresa LTDA',
    numero_cotacao: 'COT-2026-0042',
    fornecedor_nome: 'Fornecedor XYZ',
    total_itens: '12',
    prazo_resposta: '5 dias',
  }
})
```

O sistema:
1. Busca o template ativo do tipo `COTACAO_ENVIADA`
2. Substitui as variáveis `{{variavel}}` pelos valores fornecidos
3. Envia via Resend com HTML + texto puro

---

## ✅ Benefícios

- ✅ **Personalização total** - Cada tenant pode ter seus templates
- ✅ **Multi-idioma** - Crie templates em PT, EN, ES
- ✅ **Versionamento** - Crie múltiplos templates e alterne entre eles
- ✅ **Preview em tempo real** - Veja exatamente como ficará
- ✅ **Segurança** - RLS garante isolamento entre tenants
- ✅ **Flexível** - Adicione novos tipos facilmente

---

## 🎉 Pronto!

Agora você tem um **sistema completo de templates de e-mail personalizáveis**! 🚀

Acesse: **Configurações → Templates de E-mail**
