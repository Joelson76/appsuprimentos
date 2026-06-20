# 📧 Integração de Templates de E-mail - Guia Completo

## ✅ Sistema Completo Implementado!

### 🎯 O que foi criado:

1. **Serviço de E-mail** (`lib/email-service.ts`)
2. **API para Cotações** (`/api/cotacoes/[id]/enviar-email`)
3. **API para Alertas de Estoque** (`/api/estoque/alertas/enviar`)
4. **Componente de UI** (`EnviarEmailButton`)
5. **Helpers específicos** para cada tipo de e-mail

---

## 🚀 Como Usar

### 1. Enviar Cotação para Fornecedor

#### Na Interface:

```tsx
// Adicionar na página de detalhes da cotação
import { EnviarEmailButton } from '@/components/cotacoes/enviar-email-button'

<EnviarEmailButton
  cotacaoId={cotacao.id}
  emailFornecedor={cotacao.fornecedor.email}
  status={cotacao.status}
/>
```

#### Programaticamente:

```typescript
import { enviarCotacaoParaFornecedor } from '@/lib/email-service'

await enviarCotacaoParaFornecedor({
  tenantId: 'uuid-do-tenant',
  emailFornecedor: 'fornecedor@empresa.com',
  nomeFornecedor: 'Fornecedor XYZ',
  nomeEmpresa: 'Minha Empresa LTDA',
  numeroCotacao: 'COT-2026-0042',
  totalItens: 12,
  prazoResposta: '5 dias úteis',
})
```

---

### 2. Enviar Pedido de Compra

```typescript
import { enviarPedidoParaFornecedor } from '@/lib/email-service'

await enviarPedidoParaFornecedor({
  tenantId: profile.tenant_id,
  emailFornecedor: fornecedor.email,
  nomeFornecedor: fornecedor.razao_social,
  nomeEmpresa: tenant.nome_empresa,
  numeroPedido: 'PO-2026-0015',
  valorTotal: 'R$ 15.450,00',
  prazoEntrega: '15 dias úteis',
})
```

---

### 3. Alertas Automáticos de Estoque

#### Via API (manualmente):

```bash
curl -X POST http://localhost:3000/api/estoque/alertas/enviar \
  -H "Authorization: Bearer SEU-TOKEN"
```

#### Via Cron Job (automático):

```typescript
// vercel.json ou next.config.js
{
  "crons": [
    {
      "path": "/api/estoque/alertas/enviar",
      "schedule": "0 9 * * *" // Todos os dias às 9h
    }
  ]
}
```

#### Programaticamente:

```typescript
import { enviarAlertaEstoqueBaixo } from '@/lib/email-service'

await enviarAlertaEstoqueBaixo({
  tenantId: profile.tenant_id,
  emailsDestinatarios: ['admin@empresa.com', 'compras@empresa.com'],
  nomeEmpresa: tenant.nome_empresa,
  produtoNome: 'Parafuso M8',
  estoqueAtual: '10 unidades',
  estoqueMinimo: '50 unidades',
})
```

---

### 4. Boas-vindas para Novos Usuários

```typescript
import { enviarBoasVindas } from '@/lib/email-service'

// No cadastro de usuário
await enviarBoasVindas({
  tenantId: profile.tenant_id,
  emailUsuario: 'novo.usuario@empresa.com',
  nomeUsuario: 'Maria Santos',
  nomeEmpresa: tenant.nome_empresa,
})
```

---

### 5. Fatura de Assinatura

```typescript
import { enviarFaturaGerada } from '@/lib/email-service'

await enviarFaturaGerada({
  tenantId: assinatura.tenant_id,
  emailEmpresa: tenant.email,
  nomeEmpresa: tenant.nome_empresa,
  valor: 'R$ 199,00',
  vencimento: '30/06/2026',
  linkPagamento: `https://app.supriflow.com.br/faturas/${fatura.id}`,
})
```

---

## 🔧 Personalização Avançada

### Enviar com Anexos

```typescript
await enviarEmailComTemplate({
  tipo: 'PEDIDO_CRIADO',
  para: 'fornecedor@exemplo.com',
  tenantId: 'uuid-do-tenant',
  variaveis: {
    /* ... */
  },
  anexos: [
    {
      filename: 'pedido-PO-2026-0015.pdf',
      content: bufferDoPDF,
    },
  ],
})
```

### Enviar com Cópia

```typescript
await enviarEmailComTemplate({
  tipo: 'COTACAO_ENVIADA',
  para: 'fornecedor@exemplo.com',
  cc: ['compras@minhaempresa.com'],
  bcc: ['arquivo@minhaempresa.com'],
  tenantId: 'uuid-do-tenant',
  variaveis: {
    /* ... */
  },
})
```

### Criar Novo Helper Personalizado

```typescript
// lib/email-service.ts

export async function enviarRequisicaoAprovada({
  tenantId,
  emailSolicitante,
  nomeSolicitante,
  nomeEmpresa,
  numeroRequisicao,
}: {
  tenantId: string
  emailSolicitante: string
  nomeSolicitante: string
  nomeEmpresa: string
  numeroRequisicao: string
}) {
  return enviarEmailComTemplate({
    tipo: 'REQUISICAO_APROVADA',
    para: emailSolicitante,
    tenantId,
    variaveis: {
      nome_empresa: nomeEmpresa,
      numero_requisicao: numeroRequisicao,
      solicitante_nome: nomeSolicitante,
    },
  })
}
```

---

## 📊 Monitoramento

### Logs de E-mail

Os e-mails são logados automaticamente no console:

```
✅ E-mail enviado com sucesso: {
  id: 're_abc123xyz',
  tipo: 'COTACAO_ENVIADA',
  para: ['fornecedor@exemplo.com']
}
```

### Verificar Envios no Resend

Acesse: https://resend.com/emails

- Veja status de entrega
- Taxa de abertura
- Cliques em links
- Bounces e erros

---

## 🔐 Segurança

### Variáveis de Ambiente Necessárias

```env
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM="SupriFlow <noreply@supriflow.com.br>"
CRON_SECRET=seu-segredo-aleatorio-aqui
```

### Validação de Templates

O sistema valida automaticamente:
- ✅ Template existe e está ativo
- ✅ Tenant tem acesso ao template
- ✅ Todas as variáveis obrigatórias foram fornecidas
- ✅ E-mail do destinatário é válido

---

## 🧪 Testes

### Teste Manual

```typescript
// app/api/test-email/route.ts
import { enviarEmail } from '@/lib/email-service'

export async function GET() {
  try {
    await enviarEmail({
      para: 'seu-email@exemplo.com',
      assunto: 'Teste de E-mail',
      html: '<h1>Funcionou!</h1><p>Sistema de e-mail operacional.</p>',
      texto: 'Funcionou! Sistema de e-mail operacional.',
    })

    return Response.json({ success: true })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

Acesse: `http://localhost:3000/api/test-email`

---

## 📈 Estatísticas de Uso

### Quantos e-mails foram enviados?

```sql
-- Criar tabela de log (opcional)
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  tipo tipo_template_email NOT NULL,
  destinatario TEXT NOT NULL,
  assunto TEXT NOT NULL,
  message_id TEXT,
  enviado_em TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent'
);

-- Consultar estatísticas
SELECT
  tipo,
  COUNT(*) as total,
  COUNT(DISTINCT destinatario) as destinatarios_unicos
FROM email_logs
WHERE tenant_id = 'uuid-do-tenant'
  AND enviado_em > NOW() - INTERVAL '30 days'
GROUP BY tipo
ORDER BY total DESC;
```

---

## 🎯 Integração com Eventos

### Disparar e-mails automaticamente:

```typescript
// Após criar cotação
await supabase.from('cotacoes').insert(novaCotacao)

if (enviarAutomaticamente) {
  await enviarCotacaoParaFornecedor({
    /* ... */
  })
}

// Após aprovar pedido
await supabase
  .from('pedidos')
  .update({ status: 'APROVADO' })
  .eq('id', pedidoId)

await enviarPedidoParaFornecedor({
  /* ... */
})

// Ao movimentar estoque
await supabase.from('movimentacoes_estoque').insert(movimentacao)

// Verificar se estoque ficou baixo
if (novoEstoque <= estoqueMinimo) {
  await enviarAlertaEstoqueBaixo({
    /* ... */
  })
}
```

---

## ⚡ Performance

### Envio Assíncrono (Background)

```typescript
// Para não bloquear a resposta da API
async function processarPedido(pedidoId: string) {
  // Salvar no banco
  await supabase.from('pedidos').insert(novoPedido)

  // Enviar e-mail em background (não await)
  enviarPedidoParaFornecedor({
    /* ... */
  }).catch((error) => {
    console.error('Erro ao enviar e-mail:', error)
    // Registrar erro mas não falhar a operação
  })

  return { success: true }
}
```

### Batch de E-mails

```typescript
// Enviar para múltiplos destinatários de uma vez
const destinatarios = ['admin1@empresa.com', 'admin2@empresa.com']

await enviarAlertaEstoqueBaixo({
  tenantId,
  emailsDestinatarios: destinatarios, // Array
  /* ... */
})
```

---

## 📚 Referências

### Resend API
- Docs: https://resend.com/docs
- Dashboard: https://resend.com/emails
- Pricing: Free tier - 3.000 emails/mês

### Template Engine
- Variáveis: `{{nome_variavel}}`
- Escape: Não necessário (substituição simples)
- Validação: Automática

---

## ✅ Checklist de Implementação

- [x] Criar tabela `email_templates`
- [x] Inserir 5 templates padrão
- [x] Criar serviço de e-mail (`email-service.ts`)
- [x] API para cotações
- [x] API para alertas de estoque
- [x] Componente de UI (`EnviarEmailButton`)
- [x] Helpers específicos
- [x] Documentação completa
- [ ] Aplicar migrations SQL no banco
- [ ] Testar envio de e-mail
- [ ] Configurar cron jobs (opcional)
- [ ] Adicionar logs de e-mail (opcional)

---

🎉 **Sistema completo de e-mails com templates prontos para uso!**
