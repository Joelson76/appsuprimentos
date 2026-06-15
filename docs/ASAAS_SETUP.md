# Configuração da Integração Asaas

## 1. Criar Conta no Asaas

### Sandbox (Desenvolvimento)
1. Acesse: https://sandbox.asaas.com/
2. Crie uma conta de testes
3. Acesse **Integrações** > **API Key**
4. Copie a API Key

### Produção
1. Acesse: https://www.asaas.com/
2. Complete o cadastro da empresa
3. Valide os documentos
4. Acesse **Integrações** > **API Key**
5. Copie a API Key

## 2. Configurar Variáveis de Ambiente

Adicione no `.env.local`:

```bash
# Sandbox
ASAAS_API_KEY=sua_api_key_sandbox

# Produção
# ASAAS_API_KEY=sua_api_key_producao
```

## 3. Configurar Webhook

O Asaas precisa notificar seu sistema quando um pagamento é confirmado.

### URL do Webhook
```
https://seu-dominio.com/api/webhooks/asaas
```

**Desenvolvimento local:** Use o ngrok para criar um túnel:
```bash
npx ngrok http 3000
# Use a URL gerada: https://xyz.ngrok.io/api/webhooks/asaas
```

### Configurar no Asaas
1. Acesse **Configurações** > **Webhooks**
2. Clique em **Novo Webhook**
3. Cole a URL do webhook
4. Selecione os eventos:
   - ✅ `PAYMENT_RECEIVED` (Pagamento confirmado)
   - ✅ `PAYMENT_CONFIRMED` (Pagamento confirmado via PIX/boleto)
   - ✅ `PAYMENT_OVERDUE` (Pagamento vencido)
   - ✅ `PAYMENT_REFUNDED` (Pagamento estornado)
   - ✅ `PAYMENT_DELETED` (Pagamento cancelado)
5. Salve

## 4. Testar a Integração

### Criar Assinatura
1. Acesse: `/configuracoes/planos`
2. Selecione um plano
3. Escolha a forma de pagamento (PIX ou Boleto)
4. Confirme

### Simular Pagamento (Sandbox)

#### PIX
O QR Code gerado é fictício. Para simular pagamento:
1. Acesse o painel Asaas
2. Vá em **Cobranças**
3. Encontre a cobrança criada
4. Clique em **Simular Pagamento**

#### Boleto
1. Acesse o painel Asaas
2. Vá em **Cobranças**
3. Encontre a cobrança criada
4. Clique em **Simular Pagamento**

### Verificar Webhook
1. Acesse o painel Asaas
2. Vá em **Webhooks** > **Histórico**
3. Veja as chamadas realizadas

## 5. Estrutura Criada

### Backend
- `lib/asaas.ts` — Cliente da API Asaas
- `app/api/webhooks/asaas/route.ts` — Recebe notificações do Asaas
- `app/api/assinatura/criar-cobranca/route.ts` — Cria assinatura e cobrança

### Frontend
- `app/(dashboard)/configuracoes/assinatura/page.tsx` — Visualiza assinatura atual
- `app/(dashboard)/configuracoes/assinatura/checkout/page.tsx` — Checkout/pagamento
- `app/(dashboard)/configuracoes/planos/page.tsx` — Listagem de planos
- `components/billing/selecionar-plano-button.tsx` — Botão de assinatura

### Banco de Dados (já criado)
- `assinaturas` — Dados da assinatura do tenant
- `pagamentos` — Histórico de cobranças
- `planos` — Planos disponíveis
- `uso_tenants` — Contadores de uso

## 6. Fluxo Completo

```
1. Usuário seleciona plano
   ↓
2. Sistema cria/busca customer no Asaas
   ↓
3. Sistema cria subscription (assinatura recorrente)
   ↓
4. Asaas gera primeira cobrança automaticamente
   ↓
5. Sistema salva pagamento no banco com status PENDENTE
   ↓
6. Usuário paga via PIX/Boleto
   ↓
7. Asaas envia webhook PAYMENT_RECEIVED
   ↓
8. Sistema atualiza:
   - pagamento.status = PAGO
   - assinatura.status = ATIVA
   ↓
9. Usuário tem acesso ao sistema
```

## 7. Próximos Passos

- [ ] Implementar pagamento via Cartão de Crédito
- [ ] Adicionar retry automático para webhooks falhados
- [ ] Criar painel admin com métricas de MRR
- [ ] Implementar cancelamento de assinatura
- [ ] Adicionar sistema de cupons/descontos
- [ ] Enviar e-mails de confirmação (via Resend)

## 8. Troubleshooting

### Webhook não está chegando
- Verifique se a URL está correta no painel Asaas
- Confirme que a rota `/api/webhooks/asaas/route.ts` está acessível
- Use o histórico de webhooks no Asaas para ver erros

### Pagamento não ativa assinatura
- Verifique os logs do webhook
- Confirme que o `asaas_payment_id` está correto
- Veja se o RLS das tabelas permite acesso

### Erro ao criar cobrança
- Confirme que a ASAAS_API_KEY está configurada
- Veja se o customer tem CNPJ válido
- Verifique se o plano tem preço configurado

## 9. Documentação Oficial

- API Asaas: https://docs.asaas.com/reference/api
- Webhooks: https://docs.asaas.com/docs/webhooks
- Sandbox: https://docs.asaas.com/docs/ambiente-sandbox
