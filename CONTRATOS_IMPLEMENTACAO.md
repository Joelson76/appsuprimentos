# 📋 Módulo de Contratos - Documentação

**Data:** 12/06/2026  
**Status:** ✅ Implementado

## 📋 Funcionalidades Implementadas

### 1. **Cadastro de Contratos**
- ✅ Formulário completo com validações
- ✅ Vinculação com fornecedor
- ✅ Upload de documento (PDF, DOC, DOCX)
- ✅ Configuração de renovação automática
- ✅ Alerta personalizado de vencimento
- ✅ Campos: título, número, valor, vigência, observações

### 2. **Listagem de Contratos**
- ✅ Ordenação por data de término (próximos do vencimento primeiro)
- ✅ KPIs: Total, Valor Total, Ativos, Vencendo
- ✅ Badge de status colorido
- ✅ Indicador de tempo restante
- ✅ Link para detalhes

### 3. **Detalhes do Contrato**
- ✅ Visualização completa dos dados
- ✅ Informações do fornecedor
- ✅ Cálculo automático de duração e tempo restante
- ✅ Timeline visual
- ✅ Alerta de vencimento próximo
- ✅ Download de documento anexo

### 4. **Gestão de Contratos**
- ✅ Renovar contrato (estender vigência)
- ✅ Cancelar contrato
- ✅ Atualização automática de status
- ✅ Renovação automática (opcional)

### 5. **Automação de Status**
- ✅ Função PostgreSQL para atualizar status
- ✅ ATIVO → VENCENDO (quando entra no período de alerta)
- ✅ VENCENDO → VENCIDO (quando passa da data)
- ✅ VENCIDO → EM_RENOVACAO (se renovacao_auto = true)

## 🔄 Fluxo de Estados

```
ATIVO → VENCENDO → VENCIDO
   ↓        ↓          ↓
CANCELADO  CANCELADO   EM_RENOVACAO
                          ↓
                       ATIVO (novo período)
```

### Estados:
- **ATIVO**: Contrato em vigência normal
- **VENCENDO**: Dentro do período de alerta (X dias antes do fim)
- **VENCIDO**: Passou da data de término
- **CANCELADO**: Cancelado manualmente
- **EM_RENOVACAO**: Renovação automática em andamento

## 📊 Regras de Negócio

### Alerta de Vencimento
- Configurável por contrato (padrão: 30 dias)
- Status muda para VENCENDO quando faltam N dias
- Alerta visual na tela de detalhes

### Renovação Automática
- **Habilitada**: contrato renova automaticamente ao vencer
  - Novo início = fim anterior + 1 dia
  - Nova duração = mesma duração anterior
  - Status = EM_RENOVACAO
- **Desabilitada**: contrato fica como VENCIDO

### Cálculo de Duração
- Total em dias = fim - início
- Exibição: X anos e Y meses

### Tempo Restante
- Dias = fim - hoje
- Cores:
  - Verde: > 30 dias
  - Amarelo: 7-30 dias
  - Vermelho: < 7 dias ou vencido

## 📁 Estrutura de Arquivos

```
app/
├── (dashboard)/
│   └── contratos/
│       ├── page.tsx                    # Listagem
│       └── [id]/
│           └── page.tsx                # Detalhes

components/
└── contratos/
    ├── novo-contrato-dialog.tsx        # Modal de cadastro
    ├── renovar-contrato-button.tsx     # Botão renovar
    └── cancelar-contrato-button.tsx    # Botão cancelar

supabase/
└── migrations/
    ├── 20250103000000_fase3_fiscal_contratos.sql    # Tabela
    └── 20260612000001_contratos_auto_status.sql     # Auto-status
```

## 🗄️ Estrutura de Dados

### Tabela: `contratos`

```sql
CREATE TABLE contratos (
  id             UUID PRIMARY KEY,
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  fornecedor_id  UUID NOT NULL REFERENCES fornecedores(id),
  
  -- Informações gerais
  titulo         TEXT NOT NULL,
  numero         TEXT,
  valor_total    NUMERIC(15,2),
  
  -- Vigência
  inicio         DATE NOT NULL,
  fim            DATE NOT NULL,
  
  -- Controle
  status         status_contrato NOT NULL DEFAULT 'ATIVO',
  renovacao_auto BOOLEAN NOT NULL DEFAULT FALSE,
  alerta_dias    INT NOT NULL DEFAULT 30,
  
  -- Arquivos e obs
  arquivo_path   TEXT,
  observacoes    TEXT,
  
  -- Timestamps
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### ENUM: `status_contrato`
```sql
CREATE TYPE status_contrato AS ENUM (
  'ATIVO',
  'VENCENDO',
  'VENCIDO',
  'CANCELADO',
  'EM_RENOVACAO'
);
```

## 🤖 Automação de Status

### Função: `atualizar_status_contratos()`

```sql
-- Executar manualmente
SELECT atualizar_status_contratos();

-- Ou agendar via pg_cron (se disponível)
SELECT cron.schedule(
  'atualizar-status-contratos-diario',
  '0 0 * * *',
  $$SELECT atualizar_status_contratos()$$
);
```

### Lógica da Função:

1. **Marcar como VENCIDO**
   ```sql
   WHERE status IN ('ATIVO', 'VENCENDO')
     AND fim < CURRENT_DATE
   ```

2. **Marcar como VENCENDO**
   ```sql
   WHERE status = 'ATIVO'
     AND fim >= CURRENT_DATE
     AND fim <= CURRENT_DATE + alerta_dias
   ```

3. **Renovar Automaticamente**
   ```sql
   WHERE status = 'VENCIDO'
     AND renovacao_auto = true
   -- Define novo início e fim
   ```

## 🧪 Como Testar

### 1. Preparação
```bash
# Executar migrations
# 1. supabase/migrations/20250103000000_fase3_fiscal_contratos.sql (já deve estar)
# 2. supabase/migrations/20260612000001_contratos_auto_status.sql (nova)

# Servidor
npm run dev
http://localhost:3000/contratos
```

### 2. Cadastrar Contrato

```bash
# 1. Clicar em "Novo Contrato"

# 2. Preencher:
Fornecedor: [Selecionar da lista]
Título: Fornecimento de materiais elétricos
Número: 2026/001
Valor Total: 50.000,00
Data Início: 01/06/2026
Data Término: 31/12/2026
Renovação Automática: ✓
Alerta: 30 dias
Observações: Contrato anual renovável

# 3. Anexar documento (opcional)

# 4. Clicar em "Cadastrar Contrato"
```

**Resultado:**
- ✅ Toast: "Contrato cadastrado com sucesso!"
- ✅ Contrato aparece na lista
- ✅ Status: ATIVO
- ✅ KPIs atualizados

### 3. Visualizar Detalhes

```bash
# 1. Clicar em "Detalhes" no contrato
# 2. Você verá:
   - Informações completas
   - Fornecedor vinculado
   - Tempo restante calculado
   - Timeline visual
   - Botões de ação
```

### 4. Renovar Contrato

```bash
# 1. Na página de detalhes, clicar em "Renovar"
# 2. Informar nova data de término
# 3. Confirmar
# 4. Status permanece ATIVO com nova data
```

### 5. Cancelar Contrato

```bash
# 1. Clicar em "Cancelar Contrato"
# 2. Confirmar
# 3. Status muda para CANCELADO
```

### 6. Testar Automação de Status

```sql
-- Executar no Supabase SQL Editor
SELECT atualizar_status_contratos();

-- Verificar mudanças de status
SELECT titulo, inicio, fim, status, alerta_dias
FROM contratos;
```

## 📈 Cenários de Teste

### Teste 1: Contrato Ativo (Caminho Feliz)
```
Início: 01/06/2026
Fim: 31/12/2026
Hoje: 12/06/2026
Alerta: 30 dias

Status esperado: ATIVO ✅
Tempo restante: ~200 dias
Cor: Verde
```

### Teste 2: Contrato Vencendo
```
Início: 01/01/2026
Fim: 30/06/2026
Hoje: 12/06/2026
Alerta: 30 dias

Status esperado: VENCENDO ⚠️
Tempo restante: ~18 dias
Cor: Amarelo
Alerta visível: ✅
```

### Teste 3: Contrato Vencido
```
Início: 01/01/2025
Fim: 31/05/2026
Hoje: 12/06/2026
Renovação Auto: Não

Status esperado: VENCIDO ❌
Tempo restante: -12 dias
Cor: Vermelho
```

### Teste 4: Renovação Automática
```
Início: 01/01/2025
Fim: 31/05/2026
Hoje: 12/06/2026
Renovação Auto: Sim

Após executar atualizar_status_contratos():

Status: EM_RENOVACAO 🔄
Novo início: 01/06/2026
Novo fim: 31/05/2027 (mesmo período)
```

### Teste 5: Upload de Documento
```
1. Selecionar PDF do contrato
2. Verificar que arquivo < 10MB
3. Cadastrar contrato
4. Na página de detalhes, clicar em "Baixar Documento"
```

## 🔒 Segurança

### RLS (Row Level Security)
```sql
CREATE POLICY "contratos_tenant"
ON contratos FOR ALL
USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
```

### Storage Policies
- ✅ Upload apenas para usuários autenticados
- ✅ Download isolado por tenant
- ✅ Arquivos privados

### Validações
- ✅ Data fim > Data início
- ✅ Tamanho arquivo ≤ 10MB
- ✅ Tipo de arquivo permitido (PDF, DOC, DOCX)
- ✅ Campos obrigatórios validados

## 📊 KPIs e Métricas

Dashboard exibe:

```
┌────────┬──────────────┬────────┬──────────┐
│ Total  │ Valor Total  │ Ativos │ Vencendo │
├────────┼──────────────┼────────┼──────────┤
│   12   │ R$ 850.000   │   10   │    2     │
└────────┴──────────────┴────────┴──────────┘
```

### Cálculos:
- **Total**: COUNT(*)
- **Valor Total**: SUM(valor_total)
- **Ativos**: COUNT WHERE status = 'ATIVO'
- **Vencendo**: COUNT WHERE status = 'VENCENDO'

## 🚀 Próximas Melhorias (Opcional)

### Fase 2 - Recursos Avançados
- [ ] Cláusulas do contrato (tabela separada)
- [ ] Anexos múltiplos
- [ ] Histórico de alterações
- [ ] Assinaturas digitais
- [ ] Notificações por e-mail de vencimento
- [ ] Relatório de contratos
- [ ] Export para Excel/PDF
- [ ] Comentários/observações por data
- [ ] SLA e métricas de cumprimento

### Fase 3 - Integrações
- [ ] Integração com DocuSign
- [ ] Geração automática de contratos (templates)
- [ ] Vinculação com pedidos de compra
- [ ] Dashboard de compliance
- [ ] Alertas no Slack/Teams

## 🐛 Troubleshooting

### Erro: "Nenhum fornecedor disponível"
```
Solução: Cadastre fornecedores primeiro
Dashboard → Fornecedores → Novo
```

### Status não atualiza automaticamente
```sql
-- Executar manualmente
SELECT atualizar_status_contratos();

-- Verificar se pg_cron está habilitado
SELECT * FROM cron.job;
```

### Upload de arquivo falha
```
Verificar:
1. Bucket "documentos" existe? (ver migração de storage)
2. Arquivo < 10MB?
3. Tipo de arquivo: PDF, DOC ou DOCX?
```

### Data de renovação incorreta
```
Verificar:
1. Renovação automática está ativada?
2. Função atualizar_status_contratos() foi executada?
3. Contrato estava com status VENCIDO?
```

## 📚 Referências

- [Gestão de Contratos](https://en.wikipedia.org/wiki/Contract_management)
- [PostgreSQL Date/Time](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

## ✅ Conclusão

O módulo de **Contratos** está 100% funcional com:

- ✅ Cadastro completo (com upload)
- ✅ Listagem com KPIs
- ✅ Detalhes e timeline
- ✅ Renovação manual
- ✅ Cancelamento
- ✅ Atualização automática de status
- ✅ Alerta de vencimento
- ✅ Renovação automática (opcional)

**Tempo de implementação:** ~2 horas  
**Complexidade:** Média  
**Pronto para produção:** ✅ Sim

---

**Desenvolvido com ❤️ pelo SupriFlow**
