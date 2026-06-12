# Módulo de Pagamentos/Billing SaaS - Implementação Completa

## 📋 Visão Geral

Módulo completo de cobrança recorrente e gestão de assinaturas para o SupriFlow SaaS.

**Integração:** Asaas (PIX, Boleto, Cartão)  
**Multi-tenant:** Sim (RLS)  
**Status:** ✅ Implementado

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### 1. `assinaturas`
Armazena a assinatura de cada tenant.

```sql
id                UUID PRIMARY KEY
tenant_id         UUID UNIQUE REFERENCES tenants(id)
plano             tipo_plano (BASICO, PROFISSIONAL, ENTERPRISE)
valor_mensal      NUMERIC(10,2)
dia_vencimento    INT (1-28)
forma_pagamento   forma_pagamento (PIX, BOLETO, CARTAO_CREDITO, CARTAO_DEBITO)
ativa             BOOLEAN
asaas_customer_id TEXT
asaas_subscription_id TEXT
criado_em         TIMESTAMPTZ
atualizado_em     TIMESTAMPTZ
```

#### 2. `faturas`
Registra cada cobrança mensal.

```sql
id                UUID PRIMARY KEY
tenant_id         UUID REFERENCES tenants(id)
assinatura_id     UUID REFERENCES assinaturas(id)
numero            TEXT (FAT-YYYYMM-0001)
valor             NUMERIC(10,2)
vencimento        DATE
pagamento_em      DATE
status            status_pagamento (PENDENTE, PAGO, VENCIDO, CANCELADO, ESTORNADO)
asaas_payment_id  TEXT
asaas_invoice_url TEXT
linha_digitavel   TEXT
qr_code_pix       TEXT
qr_code_pix_url   TEXT
descricao         TEXT
observacoes       TEXT
```

#### 3. `historico_planos`
Auditoria de mudanças de plano.

```sql
id            UUID PRIMARY KEY
tenant_id     UUID REFERENCES tenants(id)
plano_antigo  tipo_plano
plano_novo    tipo_plano
valor_antigo  NUMERIC(10,2)
valor_novo    NUMERIC(10,2)
motivo        TEXT
usuario_id    UUID REFERENCES profiles(id)
criado_em     TIMESTAMPTZ
```

#### 4. `planos_precos`
Tabela de referência com os planos disponíveis.

```sql
plano         tipo_plano PRIMARY KEY
nome          TEXT
valor_mensal  NUMERIC(10,2)
max_usuarios  INT
descricao     TEXT
recursos      JSONB
```

**Dados iniciais:**
- **Básico:** R$ 99,90 - 5 usuários
- **Profissional:** R$ 249,90 - 20 usuários
- **Enterprise:** R$ 599,90 - Ilimitado

---

## ⚙️ Funções PostgreSQL

### 1. `gerar_numero_fatura(p_tenant_id UUID)`
Gera número único da fatura no formato: `FAT-YYYYMM-0001`

### 2. `verificar_inadimplencia()`
Bloqueia tenants com faturas vencidas há mais de 7 dias.

```sql
-- Executar via pg_cron diariamente
SELECT verificar_inadimplencia();
```

### 3. `gerar_faturas_mensais()`
Cria faturas mensais para todas as assinaturas ativas.

```sql
-- Executar todo dia 1º do mês
SELECT gerar_faturas_mensais();
```

### 4. `registrar_mudanca_plano()`
Trigger que registra no histórico quando o plano muda.

---

## 📁 Páginas Implementadas

### 1. `/configuracoes/planos`
**Função:** Escolha de plano (upgrade/downgrade)  
**Arquivo:** `app/(dashboard)/configuracoes/planos/page.tsx`

**Features:**
- ✅ Comparação visual dos 3 planos
- ✅ Badge "Mais Popular" no plano Profissional
- ✅ Badge "Plano Atual" no plano ativo
- ✅ Botões de upgrade/downgrade
- ✅ Lista de recursos por plano
- ✅ Garantia de 7 dias

### 2. `/configuracoes/assinatura`
**Função:** Portal do cliente para acompanhar assinatura  
**Arquivo:** `app/(dashboard)/configuracoes/assinatura/page.tsx`

**Features:**
- ✅ Plano atual e valor mensal
- ✅ Status da assinatura (ATIVO, TRIAL, BLOQUEADO)
- ✅ Próximo vencimento
- ✅ Histórico de faturas (últimas 10)
- ✅ Download de boleto
- ✅ QR Code PIX
- ✅ Botão "Alterar Plano"

### 3. `/admin/cobrancas`
**Função:** Painel admin de todas as cobranças  
**Arquivo:** `app/(dashboard)/admin/cobrancas/page.tsx`  
**Permissão:** SUPER_ADMIN ou ADMIN

**Features:**
- ✅ KPIs: Total Faturado, Pendente, Vencido, Taxa de Pagamento
- ✅ Lista de todas as faturas (multi-tenant)
- ✅ Badge "Vencido" em faturas atrasadas
- ✅ Link para detalhes de cada fatura

### 4. `/admin/cobrancas/[id]`
**Função:** Detalhes completos de uma fatura  
**Arquivo:** `app/(dashboard)/admin/cobrancas/[id]/page.tsx`

**Features:**
- ✅ Detalhes da fatura (número, valor, vencimento)
- ✅ Informações do cliente (tenant)
- ✅ Informações da assinatura
- ✅ Integração Asaas (Payment ID, boleto, PIX)
- ✅ Histórico da fatura
- ✅ Botões de ação:
  - Gerar Cobrança Asaas
  - Marcar como Paga
  - Cancelar Fatura

---

## 🧩 Componentes

### 1. `SelecionarPlanoButton`
**Arquivo:** `components/billing/selecionar-plano-button.tsx`

Botão para upgrade/downgrade com diálogo de confirmação.

**Props:**
- `plano`: string - Plano a selecionar
- `nomePlano`: string - Nome amigável
- `valor`: number - Valor mensal
- `planoAtual`: string - Plano atual do tenant

### 2. `GerarCobrancaButton`
**Arquivo:** `components/billing/gerar-cobranca-button.tsx`

Gera cobrança no Asaas para uma fatura pendente.

**Props:**
- `faturaId`: string - ID da fatura

### 3. `MarcarPagaButton`
**Arquivo:** `components/billing/marcar-paga-button.tsx`

Marca fatura como paga manualmente.

### 4. `CancelarFaturaButton`
**Arquivo:** `components/billing/cancelar-fatura-button.tsx`

Cancela uma fatura.

---

## 🔌 Rotas de API

### 1. `POST /api/billing/mudar-plano`
**Função:** Altera o plano da assinatura do tenant.

**Body:**
```json
{
  "plano": "PROFISSIONAL",
  "valor": 249.90
}
```

**Ações:**
1. Cria ou atualiza registro em `assinaturas`
2. Atualiza `tenants.plano`
3. Registra mudança em `historico_planos`

### 2. `POST /api/asaas/gerar-cobranca`
**Função:** Cria cobrança no Asaas para uma fatura.

**Body:**
```json
{
  "faturaId": "uuid-da-fatura"
}
```

**Fluxo:**
1. Busca ou cria customer no Asaas
2. Cria payment no Asaas (boleto ou PIX)
3. Salva `asaas_payment_id`, `linha_digitavel`, `qr_code_pix` na fatura

### 3. `POST /api/asaas/webhook`
**Função:** Recebe webhooks do Asaas sobre pagamentos.

**Eventos tratados:**
- `PAYMENT_CONFIRMED` → Status = PAGO
- `PAYMENT_RECEIVED` → Status = PAGO + ativa tenant
- `PAYMENT_OVERDUE` → Status = VENCIDO
- `PAYMENT_DELETED` → Status = CANCELADO

---

## 🔐 Segurança

### Row Level Security (RLS)
Todas as tabelas possuem RLS habilitado:

```sql
-- Exemplo (assinaturas)
CREATE POLICY "assinaturas_tenant" ON assinaturas
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );
```

### Permissões
- **Cliente:** Vê apenas suas próprias faturas
- **Admin:** Vê todas as faturas de todos os tenants

---

## 🚀 Integração com Asaas

### Variáveis de Ambiente
```env
ASAAS_API_KEY=your-api-key
ASAAS_WEBHOOK_TOKEN=your-webhook-token (opcional)
NODE_ENV=development # sandbox
NODE_ENV=production  # produção
```

### Configurar Webhook no Asaas
1. Acesse: https://sandbox.asaas.com/config/webhook (ou produção)
2. URL do Webhook: `https://seudominio.com/api/asaas/webhook`
3. Eventos:
   - ✅ PAYMENT_CONFIRMED
   - ✅ PAYMENT_RECEIVED
   - ✅ PAYMENT_OVERDUE
   - ✅ PAYMENT_DELETED

---

## 📅 Automações (pg_cron)

### Gerar Faturas Mensais
```sql
SELECT cron.schedule(
  'gerar-faturas-mensais',
  '0 0 1 * *', -- Todo dia 1º às 00:00
  'SELECT gerar_faturas_mensais();'
);
```

### Verificar Inadimplência
```sql
SELECT cron.schedule(
  'verificar-inadimplencia',
  '0 6 * * *', -- Todo dia às 06:00
  'SELECT verificar_inadimplencia();'
);
```

---

## ✅ Checklist de Implementação

### Backend
- [x] Tabelas: assinaturas, faturas, historico_planos, planos_precos
- [x] ENUMs: forma_pagamento, tipo_plano
- [x] Funções: gerar_numero_fatura, gerar_faturas_mensais, verificar_inadimplencia
- [x] Triggers: registrar_mudanca_plano
- [x] RLS policies
- [x] Índices de performance

### Frontend - Páginas
- [x] /configuracoes/planos (comparação de planos)
- [x] /configuracoes/assinatura (portal do cliente)
- [x] /admin/cobrancas (lista de faturas)
- [x] /admin/cobrancas/[id] (detalhes da fatura)

### Componentes
- [x] SelecionarPlanoButton
- [x] GerarCobrancaButton
- [x] MarcarPagaButton
- [x] CancelarFaturaButton

### API Routes
- [x] POST /api/billing/mudar-plano
- [x] POST /api/asaas/gerar-cobranca
- [x] POST /api/asaas/webhook

### Integrações
- [x] Asaas customer creation
- [x] Asaas payment creation (boleto/PIX)
- [x] Webhook handler

---

## 🧪 Como Testar

### 1. Escolher Plano
```
1. Acessar /configuracoes/planos
2. Clicar em "Fazer Upgrade" no plano Profissional
3. Confirmar no diálogo
4. ✅ Deve atualizar tenant.plano e criar/atualizar assinatura
```

### 2. Gerar Fatura Manual
```sql
SELECT gerar_faturas_mensais();
```

### 3. Gerar Cobrança Asaas
```
1. Acessar /admin/cobrancas
2. Clicar em "Detalhes" de uma fatura PENDENTE
3. Clicar em "Gerar Cobrança Asaas"
4. ✅ Deve criar customer + payment no Asaas
5. ✅ Deve salvar asaas_payment_id na fatura
```

### 4. Simular Webhook de Pagamento
```bash
curl -X POST http://localhost:3000/api/asaas/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_123",
      "externalReference": "uuid-da-fatura",
      "value": 249.90
    }
  }'
```

✅ Deve marcar fatura como PAGO

---

## 📊 Próximas Melhorias (Opcional)

- [ ] Dashboard de métricas financeiras (MRR, churn, LTV)
- [ ] Envio de e-mail de lembrete de vencimento
- [ ] Retry automático de pagamentos falhados
- [ ] Desconto por pagamento anual
- [ ] Cupons de desconto
- [ ] Trial de 14 dias automatizado
- [ ] Bloqueio de features por plano (feature flags)
- [ ] Exportação de relatórios (CSV/PDF)

---

## 📝 Notas Importantes

1. **Sandbox Asaas:** Use https://sandbox.asaas.com para testes
2. **Webhook Local:** Use ngrok ou LocalTunnel para testar webhooks localmente
3. **Inadimplência:** Tenants são bloqueados após 7 dias de atraso
4. **Renovação:** Faturas são geradas automaticamente todo dia 1º do mês
5. **Multi-tenant:** RLS garante isolamento total entre tenants

---

**✅ Módulo 100% Funcional!**
