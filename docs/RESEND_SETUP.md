# Configuração do Sistema de E-mails com Resend

## 1. Criar Conta no Resend

1. Acesse: https://resend.com/signup
2. Crie uma conta gratuita
3. Confirme seu e-mail

## 2. Configurar API Key

### Obter API Key

1. Acesse o Dashboard: https://resend.com/api-keys
2. Clique em **Create API Key**
3. Dê um nome (ex: `supriflow-production`)
4. Selecione as permissões:
   - ✅ `emails.send` (obrigatório)
   - ✅ `emails.get` (opcional, para consultar status)
5. Clique em **Create**
6. **COPIE A API KEY** (ela só será mostrada uma vez!)

### Adicionar no .env.local

```bash
# E-mail (Resend)
RESEND_API_KEY=re_SuaAPIKey_AquiXXXXXXXXXXXXXX
EMAIL_FROM="SupriFlow <noreply@supriflow.com.br>"

# URL da aplicação (para links nos e-mails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Configurar Domínio (Produção)

Para enviar e-mails em produção com seu próprio domínio:

### 3.1. Adicionar Domínio no Resend

1. Acesse: https://resend.com/domains
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `supriflow.com.br`)
4. Clique em **Add**

### 3.2. Configurar DNS

O Resend mostrará os registros DNS necessários. Adicione-os no seu provedor de DNS:

**Registros SPF, DKIM e DMARC:**
```
Tipo: TXT
Nome: @
Valor: v=spf1 include:_spf.resend.com ~all

Tipo: TXT
Nome: resend._domainkey
Valor: [Valor fornecido pelo Resend]

Tipo: TXT
Nome: _dmarc
Valor: v=DMARC1; p=none
```

### 3.3. Verificar Domínio

1. Aguarde propagação DNS (pode levar até 48h)
2. Clique em **Verify Domain** no Resend
3. Quando verificado, aparecerá um ✅ verde

### 3.4. Atualizar EMAIL_FROM

```bash
EMAIL_FROM="SupriFlow <noreply@supriflow.com.br>"
```

## 4. Templates de E-mail Disponíveis

### Trial Expirando
- **Trigger:** Job diário (pg_cron)
- **Quando:** 3 dias antes do trial expirar
- **Template:** `lib/email-templates/trial-expirando.tsx`

### Pagamento Confirmado
- **Trigger:** Webhook Asaas (PAYMENT_RECEIVED)
- **Quando:** Pagamento é confirmado
- **Template:** `lib/email-templates/pagamento-confirmado.tsx`

### Pagamento Vencido
- **Trigger:** Webhook Asaas (PAYMENT_OVERDUE)
- **Quando:** Pagamento vence sem confirmação
- **Template:** `lib/email-templates/pagamento-vencido.tsx`

### Assinatura Ativada
- **Trigger:** Webhook Asaas (primeira ativação)
- **Quando:** Trial → Ativa ou Suspensa → Ativa
- **Template:** `lib/email-templates/assinatura-ativada.tsx`

## 5. Testar Envio de E-mails

### Via API (Desenvolvimento)

```bash
# Testar Trial Expirando
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "trial",
    "email": "seu@email.com"
  }'

# Testar Pagamento Confirmado
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "pagamento-confirmado",
    "email": "seu@email.com"
  }'

# Testar Pagamento Vencido
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "pagamento-vencido",
    "email": "seu@email.com"
  }'

# Testar Assinatura Ativada
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "assinatura-ativada",
    "email": "seu@email.com"
  }'
```

### Verificar no Dashboard Resend

1. Acesse: https://resend.com/emails
2. Veja todos os e-mails enviados
3. Clique em um e-mail para ver:
   - Status (delivered, bounced, etc)
   - Tempo de envio
   - Preview do HTML
   - Logs de entrega

## 6. Fila de Notificações

### Como Funciona

1. **Eventos geram notificações:** Webhook do Asaas insere em `notificacoes_pendentes`
2. **Edge Function processa:** `supabase/functions/processar-emails/index.ts`
3. **Retry automático:** Até 3 tentativas com backoff exponencial
4. **Logs:** Erros salvos na coluna `erro` da tabela

### Processar Fila Manualmente

```bash
# Via Supabase Functions
supabase functions invoke processar-emails
```

### Agendar Processamento Automático

Adicione um cron job no `pg_cron`:

```sql
SELECT cron.schedule(
  'processar-emails-pendentes',
  '*/5 * * * *', -- A cada 5 minutos
  $$
    SELECT net.http_post(
      url := 'https://seu-projeto.supabase.co/functions/v1/processar-emails',
      headers := '{"Authorization": "Bearer SEU_ANON_KEY"}'::jsonb
    );
  $$
);
```

## 7. Limites e Preços (Resend)

### Plano Gratuito
- ✅ 100 e-mails/dia
- ✅ 3.000 e-mails/mês
- ✅ 1 domínio verificado
- ✅ API completa

### Plano Pago (Pro)
- 💰 $20/mês
- 📧 50.000 e-mails/mês
- 📧 $1 por 1.000 e-mails adicionais
- 🌐 Domínios ilimitados
- 📊 Webhooks de entrega

## 8. Monitoramento

### Logs de E-mail

```sql
-- Ver e-mails pendentes
SELECT * FROM notificacoes_pendentes 
WHERE enviado = false 
ORDER BY criado_em DESC;

-- Ver e-mails com erro
SELECT * FROM notificacoes_pendentes 
WHERE tentativas >= 3 AND enviado = false;

-- Estatísticas
SELECT 
  tipo,
  COUNT(*) as total,
  SUM(CASE WHEN enviado THEN 1 ELSE 0 END) as enviados,
  SUM(CASE WHEN tentativas >= 3 AND NOT enviado THEN 1 ELSE 0 END) as falhas
FROM notificacoes_pendentes
GROUP BY tipo;
```

### Alertas Sugeridos

- 📊 Mais de 10 e-mails falhando (tentativas >= 3)
- ⏰ Fila com mais de 50 e-mails pendentes
- 📉 Taxa de entrega < 95%

## 9. Troubleshooting

### E-mails não estão sendo enviados

**1. Verificar API Key:**
```bash
echo $RESEND_API_KEY
# Deve retornar: re_XXXXXXXXX
```

**2. Verificar logs:**
```bash
# Ver logs do Next.js
npm run dev

# Procurar por:
# ✅ E-mail enviado: xyz123
# ❌ Erro ao enviar e-mail: ...
```

**3. Testar conexão Resend:**
```bash
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": ["seu@email.com"],
    "subject": "Teste",
    "html": "<p>Teste</p>"
  }'
```

### E-mails caindo no spam

1. ✅ Configure SPF/DKIM/DMARC corretamente
2. ✅ Use domínio verificado (não use @gmail.com em FROM)
3. ✅ Evite palavras spam ("grátis", "promoção", etc)
4. ✅ Inclua link de descadastro (opcional)
5. ✅ Mantenha taxa de bounce baixa (<5%)

### Domínio não verificando

1. Aguarde 48h propagação DNS
2. Use ferramenta: https://mxtoolbox.com/
3. Verifique registros TXT no DNS
4. Contate suporte Resend se persistir

## 10. Próximas Melhorias

- [ ] Adicionar e-mail de boas-vindas no cadastro
- [ ] E-mail semanal com resumo de atividades
- [ ] Notificações de aprovação de requisições
- [ ] E-mail quando cotação é respondida
- [ ] Newsletter mensal (opcional)
- [ ] Templates personalizáveis por tenant
- [ ] Suporte a anexos (PDFs de pedidos)

## 11. Recursos Úteis

- 📚 Documentação Resend: https://resend.com/docs
- 🔧 Status da API: https://resend.com/status
- 💬 Suporte: https://resend.com/support
- 🎨 Exemplos de templates: https://react.email/examples
