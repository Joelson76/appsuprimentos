# 📧 Templates de E-mail - SupriFlow

Este diretório contém os templates de e-mail transacionais utilizados no sistema.

## Templates Disponíveis

### 1. **boas-vindas.tsx**
**Quando é enviado:** Imediatamente após o cadastro de uma nova empresa

**Destinatário:** Usuário administrador que acabou de se cadastrar

**Conteúdo:**
- Confirmação de cadastro
- Dados da conta (e-mail, empresa, plano, data fim do trial)
- Botão de acesso ao sistema
- Próximos passos sugeridos
- Dicas para começar

**Props:**
```typescript
{
  nomeAdmin: string      // Nome do administrador
  nomeEmpresa: string    // Razão social da empresa
  email: string          // E-mail de login
  plano: string          // Plano contratado
  trialFim: string       // Data fim do trial (formato: dd/mm/aaaa)
}
```

---

### 2. **pedido-fornecedor.tsx**
**Quando é enviado:** Ao clicar em "Enviar para Fornecedor" (status APROVADO → ENVIADO)

**Destinatário:** E-mail do fornecedor cadastrado

**Conteúdo:**
- Número do pedido
- Data de emissão e entrega prevista
- Condição de pagamento
- Tabela detalhada com itens, quantidades e valores
- Valor total destacado
- Observações (se houver)

**Props:**
```typescript
{
  fornecedorNome: string
  numeroPedido: string
  dataEmissao: string
  dataEntregaPrevista?: string
  condicaoPagamento?: string
  itens: Array<{
    descricao: string
    quantidade: number
    valorUnitario: number
    prazoEntrega?: number
  }>
  valorTotal: number
  observacoes?: string
}
```

---

### 3. **cotacao-fornecedor.tsx**
**Quando é enviado:** Ao criar cotação e enviar para fornecedores

**Destinatário:** E-mail dos fornecedores selecionados

**Conteúdo:**
- Número da cotação
- Data limite para resposta
- Lista de itens solicitados
- Link único (token) para responder online
- Instruções de preenchimento

**Props:**
```typescript
{
  fornecedorNome: string
  numeroCotacao: string
  dataLimite: string
  itens: Array<{
    descricao: string
    quantidade: number
    unidade: string
  }>
  linkResposta: string
  observacoes?: string
}
```

---

## Padrão Visual

Todos os templates seguem o mesmo padrão de design:

### Cores
- **Principal:** `#16a34a` (verde SupriFlow)
- **Fundo:** `#f9fafb` (cinza claro)
- **Cards:** `#ffffff` (branco)
- **Texto principal:** `#1e293b` (cinza escuro)
- **Texto secundário:** `#475569` (cinza médio)

### Estrutura
1. **Header** - Logo e título em verde
2. **Corpo** - Conteúdo principal em card branco
3. **Boxes destacados** - Informações importantes com bordas coloridas
4. **CTAs** - Botões verdes para ações principais
5. **Footer** - Texto pequeno com aviso de e-mail automático

### Elementos Comuns
- **Box verde** (`#f0fdf4` + borda `#16a34a`) - Dados/informações
- **Box azul** (`#eff6ff` + texto `#1e40af`) - Avisos importantes
- **Box amarelo** (`#fef3c7` + borda `#f59e0b`) - Observações/dicas
- **Tabelas** - Header cinza claro com bordas suaves

## Como Testar Localmente

### 1. Configure o Resend
```env
# .env.local
RESEND_API_KEY=re_suachave
EMAIL_FROM=onboarding@resend.dev  # ou seu domínio verificado
```

### 2. Teste via Script Node.js
```javascript
// test-email.js
require('dotenv').config({ path: '.env.local' })
const { Resend } = require('resend')
const { BoasVindasEmail } = require('./lib/email-templates/boas-vindas')

const resend = new Resend(process.env.RESEND_API_KEY)

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'seu-email@exemplo.com',
  subject: 'Teste - Boas-vindas',
  react: BoasVindasEmail({
    nomeAdmin: 'João Silva',
    nomeEmpresa: 'Empresa Teste LTDA',
    email: 'joao@teste.com',
    plano: 'PROFISSIONAL',
    trialFim: '25/06/2026'
  })
})
```

### 3. Ou teste criando uma conta
```bash
npm run dev
# Acesse http://localhost:3000/cadastro
# Preencha o formulário
# Verifique seu e-mail!
```

## Verificar Envios

Acesse o dashboard do Resend:
- **Logs:** https://resend.com/emails
- **Status:** enviado, entregue, aberto, erro
- **Preview:** visualize o e-mail renderizado

## Boas Práticas

### ✅ Fazer
- Usar componentes inline-style (e-mails não suportam CSS externo)
- Testar em diferentes clientes (Gmail, Outlook, Apple Mail)
- Manter largura máxima de 600px
- Usar cores de alto contraste para acessibilidade
- Incluir versão texto junto com HTML (Resend faz automaticamente)

### ❌ Evitar
- CSS classes ou arquivos externos
- JavaScript
- Imagens hospedadas localmente (usar URLs absolutas)
- Fontes customizadas (usar web-safe fonts)
- Layouts complexos com flexbox/grid

## Roadmap

### Próximos Templates
- [ ] **Cotação vencida** - Lembrete para fornecedor que não respondeu
- [ ] **Pedido recebido** - Confirmação de recebimento de mercadoria
- [ ] **Pagamento pendente** - Aviso de cobrança do SaaS
- [ ] **Trial expirando** - 3 dias antes do fim do trial
- [ ] **Trial expirado** - Convite para upgrade
- [ ] **Nova requisição** - Notificar aprovador
- [ ] **Requisição aprovada** - Notificar solicitante
- [ ] **Relatório mensal** - Resumo de compras do mês

## Recursos

- **Resend Docs:** https://resend.com/docs
- **React Email:** https://react.email
- **Email Client Support:** https://www.caniemail.com
