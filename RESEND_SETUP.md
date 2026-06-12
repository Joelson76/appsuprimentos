# 📧 Configuração do Resend para Envio de E-mails

## 🎯 O que é o Resend?

O Resend é um serviço moderno de envio de e-mails transacionais, ideal para SaaS.

- ✅ API simples e moderna
- ✅ React Email support (templates em JSX/TSX)
- ✅ Fácil integração
- ✅ Dashboard com métricas
- ✅ Plano gratuito: 100 e-mails/dia

## 🚀 Passo a Passo para Configurar

### 1️⃣ Criar Conta no Resend

1. Acesse: https://resend.com
2. Clique em **"Sign Up"**
3. Crie sua conta (pode usar GitHub)

### 2️⃣ Obter API Key

1. Acesse: https://resend.com/api-keys
2. Clique em **"Create API Key"**
3. Dê um nome (ex: "SupriFlow Production")
4. Copie a chave (começa com `re_...`)
5. **IMPORTANTE**: Salve em local seguro, só aparece uma vez!

### 3️⃣ Adicionar ao Projeto

#### Desenvolvimento Local (`.env.local`):

```env
RESEND_API_KEY=re_SuaChaveAqui123456789
EMAIL_FROM=noreply@supriflow.com.br
```

#### Produção (Vercel):

```bash
# Via CLI
vercel env add RESEND_API_KEY production
vercel env add EMAIL_FROM production

# Ou via Dashboard
# https://vercel.com/seu-projeto/settings/environment-variables
```

### 4️⃣ Verificar Domínio (Produção)

Para enviar e-mails de um domínio personalizado:

1. Acesse: https://resend.com/domains
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `supriflow.com.br`)
4. Adicione os registros DNS fornecidos:
   - **SPF** (TXT)
   - **DKIM** (TXT)
   - **DMARC** (TXT)
5. Aguarde verificação (~15 minutos)

**Sem domínio verificado**: use `onboarding@resend.dev` (apenas para testes)

### 5️⃣ Testar Envio

```bash
# Marcar um pedido como APROVADO
npm run dev

# No browser, aprovar e enviar um pedido
# O e-mail será enviado automaticamente
```

## 📊 Tipos de E-mail Enviados

### 1. **Pedido para Fornecedor**
**Quando**: Ao clicar em "Enviar para Fornecedor" (status APROVADO → ENVIADO)

**Template**: `PedidoFornecedorEmail`

**Conteúdo**:
- Número do pedido
- Data de emissão
- Data de entrega prevista
- Condição de pagamento
- Tabela com itens, quantidades e valores
- Valor total destacado
- Observações (se houver)

### 2. **Cotação para Fornecedor** (Futuro)
**Quando**: Ao enviar links de cotação

**Template**: `CotacaoFornecedorEmail`

**Conteúdo**:
- Número da cotação
- Data limite para resposta
- Lista de itens solicitados
- Link único para responder online

## 🧪 Teste em Desenvolvimento

Durante o desenvolvimento, você pode:

1. **Usar e-mail de teste do Resend**:
   ```env
   EMAIL_FROM=onboarding@resend.dev
   ```

2. **Enviar para seu próprio e-mail**:
   - Os e-mails vão para o e-mail cadastrado no fornecedor
   - Cadastre um fornecedor com SEU e-mail para testar

3. **Ver logs no Resend Dashboard**:
   - https://resend.com/emails
   - Veja status (enviado, aberto, erro)
   - Preview do e-mail

## ⚠️ Limites e Preços

### Plano Gratuito:
- ✅ 100 e-mails/dia
- ✅ 3.000 e-mails/mês
- ✅ Perfeito para testes e MVP

### Plano Pago ($20/mês):
- ✅ 50.000 e-mails/mês
- ✅ Suporte prioritário
- ✅ Domínios customizados ilimitados

## 🔍 Troubleshooting

### Erro: "API key not configured"
```
Solução: Adicione RESEND_API_KEY no .env.local
```

### Erro: "Email address not verified"
```
Solução: Use onboarding@resend.dev OU verifique seu domínio
```

### E-mail não chega
```
1. Verifique se o fornecedor tem e-mail cadastrado
2. Cheque spam/lixeira
3. Veja logs no Resend Dashboard
4. Verifique se a API key está correta
```

### Erro: "Domain not verified"
```
Solução: 
1. Adicione os registros DNS corretamente
2. Aguarde propagação (até 48h)
3. Use onboarding@resend.dev enquanto isso
```

## 📚 Documentação Oficial

- **Resend Docs**: https://resend.com/docs
- **React Email**: https://react.email
- **API Reference**: https://resend.com/docs/api-reference

## ✅ Checklist de Configuração

- [ ] Conta criada no Resend
- [ ] API Key gerada
- [ ] API Key adicionada no `.env.local`
- [ ] `EMAIL_FROM` configurado
- [ ] Testado envio local
- [ ] API Key adicionada na Vercel
- [ ] Domínio verificado (produção)
- [ ] Testado envio em produção

## 🎉 Pronto!

Agora o sistema envia e-mails automaticamente quando você:
- Envia um pedido para fornecedor
- (Futuro) Envia cotações para fornecedores
