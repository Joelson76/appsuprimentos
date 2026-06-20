# 📧 Como Usar os Templates de E-mail - Guia Visual

## 🎯 Entendendo o Sistema

Os templates **NÃO precisam ser selecionados manualmente**. O sistema escolhe automaticamente baseado na ação:

```
Ação do Usuário          →  Sistema Busca Template  →  Envia E-mail
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Enviar Cotação           →  COTACAO_ENVIADA         →  📧 Para fornecedor
Criar Pedido             →  PEDIDO_CRIADO           →  📧 Para fornecedor
Estoque baixo            →  ESTOQUE_BAIXO           →  📧 Para admins
Novo usuário             →  BEM_VINDO               →  📧 Para usuário
Fatura gerada            →  FATURA_GERADA           →  📧 Para empresa
```

---

## 📋 Onde Ver os Templates

### URL Direta:
- **Local**: http://localhost:3000/configuracoes/templates-email
- **Produção**: https://appsuprimentos.vercel.app/configuracoes/templates-email

### Ou Navegando:
1. Clique em **"⚙️ Configurações"** (menu lateral)
2. Procure a seção **"Notificações"**
3. Clique no card **"📧 Templates de E-mail"**

---

## 🎨 Gerenciando Templates

### Visualizar Template (Preview)

Na página de templates, clique em **"👁️ Preview"** para ver:

```
┌─────────────────────────────────────────────┐
│ Preview do Template                          │
├─────────────────────────────────────────────┤
│ ASSUNTO:                                     │
│ Nova Solicitação de Cotação #COT-2026-0042  │
├─────────────────────────────────────────────┤
│ [Visualização HTML] [Código HTML] [Texto]   │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ 📋 Nova Solicitação de Cotação          │ │
│ │                                         │ │
│ │ Olá, Fornecedor XYZ!                    │ │
│ │                                         │ │
│ │ A empresa Minha Empresa LTDA está...    │ │
│ │                                         │ │
│ │ Informações da Cotação                  │ │
│ │ • Número: COT-2026-0042                 │ │
│ │ • Total de Itens: 12                    │ │
│ │                                         │ │
│ │    [ Responder Cotação ]                │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Editar Template

1. Clique em **"✏️ Editar"**
2. Altere o que quiser:
   - **Assunto**: Título do e-mail
   - **Corpo HTML**: Design visual
   - **Corpo Texto**: Versão texto puro
3. Clique em **"Salvar"**

### Criar Variações

Você pode criar múltiplos templates do mesmo tipo:

```sql
-- Exemplo: 3 templates de cotação
Cotação Enviada - Padrão PT-BR    (✅ Ativo)
Cotação Enviada - Formal          (❌ Inativo)
Cotação Enviada - Versão Inglês   (❌ Inativo)
```

Para trocar qual está ativo:
1. Desative o atual
2. Ative o que quer usar

**Apenas 1 pode estar ativo por vez!**

---

## 🔧 Usando na Prática

### 1. Enviar Cotação por E-mail

#### Adicionar Botão na Página de Cotação:

Edite o arquivo: `app/(dashboard)/cotacoes/[id]/page.tsx`

```tsx
// No topo do arquivo, adicione:
import { EnviarEmailButton } from '@/components/cotacoes/enviar-email-button'

// Dentro do JSX, onde tem os outros botões, adicione:
<EnviarEmailButton
  cotacaoId={cotacao.id}
  emailFornecedor={cotacao.fornecedor?.email}
  status={cotacao.status}
/>
```

**Resultado visual:**
```
┌────────────────────────────────────────────┐
│ Cotação #COT-2026-0042                     │
│                                            │
│ [← Voltar] [📧 Enviar por E-mail] [Gerar Pedido] │
└────────────────────────────────────────────┘
```

Quando clicar:
1. Abre confirmação: "Enviar cotação para fornecedor@exemplo.com?"
2. Usuário confirma
3. Sistema busca template **COTACAO_ENVIADA** ativo
4. Substitui variáveis ({{numero_cotacao}}, etc.)
5. Envia via Resend
6. Mostra toast de sucesso ✅

---

### 2. Alertas Automáticos de Estoque

Sem ação manual! Configure o cron job:

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/estoque/alertas/enviar",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Todo dia às 9h:
1. Sistema verifica produtos com estoque <= mínimo
2. Para cada produto, busca template **ESTOQUE_BAIXO**
3. Envia e-mail para admins do tenant

**Ou teste manualmente:**
```bash
curl -X POST http://localhost:3000/api/estoque/alertas/enviar
```

---

### 3. Boas-vindas (Novo Usuário)

Adicione no código de cadastro de usuário:

```typescript
// app/api/usuarios/criar/route.ts
import { enviarBoasVindas } from '@/lib/email-service'

// Após criar usuário no banco
await enviarBoasVindas({
  tenantId: profile.tenant_id,
  emailUsuario: novoUsuario.email,
  nomeUsuario: novoUsuario.nome,
  nomeEmpresa: tenant.nome_empresa,
})
```

---

## 🎨 Personalizando Templates

### Adicionar Logo da Empresa

Edite o template e altere o header HTML:

**Antes:**
```html
<div class="header">
  <h1>📋 Nova Solicitação de Cotação</h1>
</div>
```

**Depois:**
```html
<div class="header" style="text-align: center;">
  <img src="https://sua-empresa.com/logo.png" 
       alt="Logo" 
       style="max-width: 180px; margin-bottom: 15px;">
  <h1>Nova Solicitação de Cotação</h1>
</div>
```

### Mudar Cores

Encontre no CSS do template:

```html
<style>
  .header { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
  }
  .button { 
    background: #667eea; 
  }
</style>
```

Troque as cores:
```html
<style>
  .header { 
    background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); 
  }
  .button { 
    background: #1e40af; 
  }
</style>
```

### Adicionar Rodapé Personalizado

```html
<div class="footer">
  <p><strong>{{nome_empresa}}</strong></p>
  <p>CNPJ: 12.345.678/0001-90</p>
  <p>Endereço: Rua Exemplo, 123 - São Paulo/SP</p>
  <p>Tel: (11) 1234-5678 | email@empresa.com</p>
  <p style="margin-top: 10px; font-size: 11px; color: #999;">
    Este é um e-mail automático. Por favor, não responda.
  </p>
</div>
```

---

## 🔍 Variáveis Disponíveis por Tipo

### COTACAO_ENVIADA
- `{{nome_empresa}}` - Nome da sua empresa
- `{{numero_cotacao}}` - Ex: COT-2026-0042
- `{{fornecedor_nome}}` - Nome do fornecedor
- `{{total_itens}}` - Quantidade de itens
- `{{prazo_resposta}}` - Ex: "5 dias"

### PEDIDO_CRIADO
- `{{nome_empresa}}`
- `{{numero_pedido}}` - Ex: PO-2026-0015
- `{{fornecedor_nome}}`
- `{{valor_total}}` - Ex: R$ 15.450,00
- `{{prazo_entrega}}` - Ex: "15 dias"

### ESTOQUE_BAIXO
- `{{nome_empresa}}`
- `{{produto_nome}}` - Ex: Parafuso M8
- `{{estoque_atual}}` - Ex: 10 unidades
- `{{estoque_minimo}}` - Ex: 50 unidades

### BEM_VINDO
- `{{nome_empresa}}`
- `{{usuario_nome}}` - Nome do novo usuário
- `{{email}}` - E-mail do usuário

### FATURA_GERADA
- `{{nome_empresa}}`
- `{{valor}}` - Ex: R$ 199,00
- `{{vencimento}}` - Ex: 30/06/2026
- `{{link_pagamento}}` - URL para pagamento

---

## ✅ Checklist de Uso

Para começar a usar:

- [ ] Aplicar migration 1 (criar tabela)
- [ ] Aplicar migration 2 (criar função)
- [ ] Executar `SELECT criar_templates_padrao('SEU-TENANT-ID')`
- [ ] Acessar `/configuracoes/templates-email`
- [ ] Ver os 5 templates criados
- [ ] Clicar em "Preview" para visualizar
- [ ] (Opcional) Editar e personalizar
- [ ] Adicionar botão de enviar nas cotações
- [ ] Testar envio de e-mail

---

## 🎯 Resumo

**Você NÃO escolhe o template manualmente!**

O sistema funciona assim:

1. Usuário faz ação (enviar cotação, criar pedido, etc.)
2. Código chama função helper (ex: `enviarCotacaoParaFornecedor()`)
3. Sistema busca template ativo do tipo no banco
4. Substitui variáveis com dados reais
5. Envia via Resend
6. Pronto! ✅

**Templates são gerenciados em**: `/configuracoes/templates-email`
- Ver preview
- Editar conteúdo
- Ativar/desativar
- Criar variações

Simples assim! 🚀
