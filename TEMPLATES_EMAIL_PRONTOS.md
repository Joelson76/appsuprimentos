# 📧 Templates de E-mail Prontos

## 🎨 5 Templates Profissionais Incluídos

Criamos **5 templates prontos** com design responsivo e profissional para você começar a usar imediatamente!

---

## 📋 Templates Disponíveis

### 1. **Cotação Enviada** 💰
**Quando usar:** Ao enviar solicitação de cotação para fornecedores

**Design:**
- Header gradiente roxo/azul
- Box destacado com informações da cotação
- Lista de requisitos
- Botão de ação "Responder Cotação"

**Variáveis:**
- `{{nome_empresa}}` - Nome da sua empresa
- `{{numero_cotacao}}` - Ex: COT-2026-0042
- `{{fornecedor_nome}}` - Nome do fornecedor
- `{{total_itens}}` - Quantidade de itens
- `{{prazo_resposta}}` - Prazo em dias

---

### 2. **Pedido de Compra** 🛒
**Quando usar:** Confirmação de pedido enviado ao fornecedor

**Design:**
- Header verde (aprovação/sucesso)
- Valor total em destaque
- Grid com número do pedido e prazo
- Alerta amarelo com instruções
- Lista de próximos passos

**Variáveis:**
- `{{nome_empresa}}` - Nome da sua empresa
- `{{numero_pedido}}` - Ex: PO-2026-0015
- `{{fornecedor_nome}}` - Nome do fornecedor
- `{{valor_total}}` - Ex: R$ 15.450,00
- `{{prazo_entrega}}` - Prazo em dias

---

### 3. **Alerta de Estoque Baixo** ⚠️
**Quando usar:** Estoque atinge nível mínimo (automático)

**Design:**
- Header vermelho (alerta)
- Box de alerta destacado com ícone
- Estatísticas lado a lado (atual vs mínimo)
- Box verde com ação recomendada
- Botão "Criar Requisição de Compra"

**Variáveis:**
- `{{nome_empresa}}` - Nome da sua empresa
- `{{produto_nome}}` - Ex: Parafuso M8
- `{{estoque_atual}}` - Ex: 10 unidades
- `{{estoque_minimo}}` - Ex: 50 unidades

---

### 4. **Boas-vindas** 🎉
**Quando usar:** Novo usuário cadastrado no sistema

**Design:**
- Header roxo com gradiente
- Banner de boas-vindas com emoji grande
- 4 features do sistema com ícones
- Box verde com primeiros passos
- Botão "Acessar o Sistema"

**Variáveis:**
- `{{nome_empresa}}` - Nome da sua empresa
- `{{usuario_nome}}` - Nome do novo usuário
- `{{email}}` - E-mail de acesso

---

### 5. **Fatura Gerada** 💳
**Quando usar:** Nova fatura de assinatura disponível

**Design:**
- Header azul (financeiro)
- Valor da fatura em destaque (fonte grande)
- Data de vencimento
- Botão "Pagar Agora" com link
- Box amarelo com formas de pagamento

**Variáveis:**
- `{{nome_empresa}}` - Nome da sua empresa
- `{{valor}}` - Ex: R$ 199,00
- `{{vencimento}}` - Ex: 30/06/2026
- `{{link_pagamento}}` - URL para pagamento

---

## 🚀 Como Aplicar os Templates Prontos

### Passo 1: Execute as Migrations

Execute no **Supabase SQL Editor**:

```sql
-- 1. Primeiro, execute a migration da tabela (se ainda não fez)
-- (Conteúdo de 20260620000002_create_email_templates.sql)

-- 2. Depois, execute a migration dos templates prontos
-- (Conteúdo de 20260620000003_insert_default_templates.sql)
```

### Passo 2: Criar Templates para seu Tenant

Execute esta função SQL substituindo o `tenant_id`:

```sql
-- Obter seu tenant_id
SELECT id, nome_empresa FROM tenants;

-- Criar templates para o tenant (substitua o UUID)
SELECT criar_templates_padrao('SEU-TENANT-ID-AQUI');

-- Exemplo:
SELECT criar_templates_padrao('c7f69c82-0968-4190-a26e-eb6005ee3a9c');
```

### Passo 3: Verificar Templates Criados

```sql
SELECT tipo, nome, ativo
FROM email_templates
WHERE tenant_id = 'SEU-TENANT-ID'
ORDER BY tipo;
```

---

## 📱 Preview dos Templates

### Exemplo: Cotação Enviada

```
┌─────────────────────────────────────┐
│   📋 Nova Solicitação de Cotação    │ ← Header roxo/azul
├─────────────────────────────────────┤
│ Olá, Fornecedor XYZ!                │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Informações da Cotação          │ │ ← Box info
│ │ • Número: COT-2026-0042         │ │
│ │ • Total de Itens: 12            │ │
│ │ • Prazo: 5 dias                 │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Por favor, envie:                   │
│ ✓ Preço unitário                    │
│ ✓ Prazo de entrega                  │
│ ✓ Condições de pagamento            │
│                                      │
│     [ Responder Cotação ]           │ ← Botão azul
│                                      │
├─────────────────────────────────────┤
│ Empresa Exemplo LTDA                │ ← Footer
└─────────────────────────────────────┘
```

---

## 🎨 Características dos Templates

### ✅ Design Responsivo
- Adaptam automaticamente para desktop e mobile
- Largura máxima de 600px
- Fontes e espaçamentos otimizados

### ✅ HTML + Texto Puro
- Versão HTML para visualização bonita
- Versão texto para compatibilidade
- Suporte a todos os clientes de email

### ✅ Variáveis Dinâmicas
- Sistema de substituição `{{variavel}}`
- Dados injetados automaticamente
- Validação de campos obrigatórios

### ✅ Identidade Visual
- Cores consistentes por tipo
- Gradientes modernos
- Ícones e emojis estratégicos

---

## 🔧 Personalização

Todos os templates podem ser editados:

1. **Acesse:** Configurações → Templates de E-mail
2. **Clique em "Editar"** no template desejado
3. **Modifique:**
   - Assunto
   - Corpo HTML
   - Texto puro
   - Variáveis
4. **Preview** antes de salvar
5. **Ative** o template

---

## 📊 Paleta de Cores por Tipo

| Tipo | Cor Principal | Uso |
|------|---------------|-----|
| Cotação | `#667eea` (Roxo/Azul) | Processos comerciais |
| Pedido | `#10b981` (Verde) | Confirmações e aprovações |
| Estoque | `#ef4444` (Vermelho) | Alertas e avisos |
| Boas-vindas | `#667eea` (Roxo) | Engajamento |
| Fatura | `#3b82f6` (Azul) | Financeiro |

---

## 💡 Dicas de Uso

### Personalização Avançada

```html
<!-- Adicione o logo da sua empresa -->
<div class="header">
  <img src="https://sua-empresa.com/logo.png" alt="Logo" style="max-width: 150px;">
  <h1>Título do Email</h1>
</div>

<!-- Use cores da sua marca -->
<style>
  .header { background: #SUA-COR-AQUI; }
  .button { background: #SUA-COR-AQUI; }
</style>
```

### Variáveis Customizadas

```javascript
// Ao enviar o email
await enviarEmail({
  tipo: 'COTACAO_ENVIADA',
  para: 'fornecedor@exemplo.com',
  variaveis: {
    nome_empresa: tenant.nome_empresa,
    numero_cotacao: cotacao.numero,
    fornecedor_nome: fornecedor.razao_social,
    total_itens: cotacao.itens.length.toString(),
    prazo_resposta: '5 dias',
  }
})
```

---

## 🎯 Próximos Passos

1. ✅ Aplicar migrations SQL
2. ✅ Criar templates para seu tenant
3. ✅ Testar preview dos templates
4. ✅ Personalizar com logo e cores da empresa
5. ✅ Ativar os templates desejados
6. ✅ Sistema começará a usar automaticamente!

---

**🎉 Agora você tem 5 templates profissionais prontos para usar!**

Todos com design responsivo, variáveis dinâmicas e identidade visual moderna.
