# 📦 Módulo de Estoque - Documentação

**Data:** 12/06/2026  
**Status:** ✅ Implementado

## 📋 Funcionalidades Implementadas

### 1. **Cadastro de Produtos**
- ✅ Formulário completo com validações
- ✅ Código SKU único por tenant
- ✅ Múltiplas unidades de medida (UN, KG, L, M, etc)
- ✅ Vinculação com categoria
- ✅ Estoque mínimo configurável
- ✅ Localização física (prateleira, depósito)
- ✅ Controle de ativo/inativo

### 2. **Listagem de Produtos**
- ✅ KPIs: Total, Abaixo do Mínimo, Crítico, Normal
- ✅ Badge de status colorido (Normal/Baixo/Crítico)
- ✅ Barra de progresso visual
- ✅ Filtro por categoria
- ✅ Links para detalhes

### 3. **Detalhes do Produto**
- ✅ Informações completas
- ✅ Estoque atual vs mínimo
- ✅ Alerta de estoque baixo/crítico
- ✅ Barra de progresso visual
- ✅ **Histórico completo de movimentações**

### 4. **Movimentação de Estoque**
- ✅ 5 tipos de movimentação:
  - ENTRADA (recebimento de mercadoria)
  - SAIDA (venda, uso, transferência)
  - AJUSTE_MAIS (correção positiva)
  - AJUSTE_MENOS (correção negativa)
  - TRANSFERENCIA (entre locais)
- ✅ Validação de saldo (impede saldo negativo)
- ✅ Preview do novo saldo antes de confirmar
- ✅ Registro de usuário e timestamp
- ✅ Observações opcionais

### 5. **Histórico e Auditoria**
- ✅ Registro de todas as movimentações
- ✅ Saldo anterior e posterior
- ✅ Usuário responsável
- ✅ Data/hora precisa
- ✅ Observações

### 6. **Integração Automática**
- ✅ **Entrada automática ao receber pedido**
- ✅ Trigger cria/busca produto automaticamente
- ✅ Atualiza estoque ao confirmar recebimento

## 🔄 Fluxo de Movimentações

```
Produto
  ↓
Movimentação (tipo, quantidade, observação)
  ↓
Validação (saldo >= 0?)
  ↓
Registro na tabela movimentacoes_estoque
  ↓
Atualização do estoque_atual do produto
  ↓
Histórico completo mantido
```

## 📊 Tipos de Movimentação

| Tipo | Ícone | Efeito | Uso |
|------|-------|--------|-----|
| ENTRADA | ⬆️ | +quantidade | Recebimento de compra |
| SAIDA | ⬇️ | -quantidade | Venda, uso, consumo |
| AJUSTE_MAIS | ➕ | +quantidade | Correção de inventário |
| AJUSTE_MENOS | ➖ | -quantidade | Perda, quebra, extravio |
| TRANSFERENCIA | 🔄 | ±quantidade | Entre locais (futuro) |

## 📁 Estrutura de Arquivos

```
app/
├── (dashboard)/
│   └── estoque/
│       ├── page.tsx                    # Listagem
│       └── [id]/
│           └── page.tsx                # Detalhes + histórico

components/
└── estoque/
    ├── novo-produto-dialog.tsx         # Modal de cadastro
    └── movimentar-estoque-dialog.tsx   # Modal de movimentação

supabase/
└── migrations/
    └── 20250104000000_fase4_estoque_dashboard.sql  # Tabelas + funções
```

## 🗄️ Estrutura de Dados

### Tabela: `produtos`

```sql
CREATE TABLE produtos (
  id                    UUID PRIMARY KEY,
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  
  -- Identificação
  descricao             TEXT NOT NULL,
  codigo                TEXT,
  unidade               TEXT NOT NULL DEFAULT 'UN',
  categoria_id          UUID REFERENCES categorias(id),
  
  -- Estoque
  estoque_atual         NUMERIC(15,3) NOT NULL DEFAULT 0,
  estoque_minimo_alerta NUMERIC(15,3),
  localizacao           TEXT,
  
  -- Controle
  ativo                 BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(codigo, tenant_id)
);
```

### Tabela: `movimentacoes_estoque`

```sql
CREATE TABLE movimentacoes_estoque (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  produto_id      UUID NOT NULL REFERENCES produtos(id),
  
  -- Movimentação
  tipo            tipo_movimentacao NOT NULL,
  quantidade      NUMERIC(15,3) NOT NULL,
  
  -- Saldos
  saldo_anterior  NUMERIC(15,3) NOT NULL,
  saldo_posterior NUMERIC(15,3) NOT NULL,
  
  -- Rastreabilidade
  pedido_id       UUID REFERENCES pedidos(id),
  requisicao_id   UUID REFERENCES requisicoes(id),
  usuario_id      UUID NOT NULL REFERENCES profiles(id),
  observacao      TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### ENUM: `tipo_movimentacao`

```sql
CREATE TYPE tipo_movimentacao AS ENUM (
  'ENTRADA',
  'SAIDA',
  'AJUSTE_MAIS',
  'AJUSTE_MENOS',
  'TRANSFERENCIA'
);
```

## 🤖 Automação

### Entrada Automática ao Receber Pedido

```sql
CREATE TRIGGER estoque_apos_recebimento
  AFTER UPDATE ON recebimentos
  FOR EACH ROW EXECUTE FUNCTION entrada_estoque_recebimento();
```

**Lógica:**
1. Ao confirmar recebimento (status → COMPLETO/PARCIAL)
2. Para cada item recebido:
   - Busca produto por descrição
   - Se não existe, cria automaticamente
   - Registra entrada no estoque
3. Quantidade recebida é adicionada ao estoque

### Função: `movimentar_estoque()`

```sql
SELECT movimentar_estoque(
  p_produto_id := '<uuid>',
  p_tipo := 'ENTRADA',
  p_quantidade := 100,
  p_pedido_id := NULL,
  p_req_id := NULL,
  p_observacao := 'Compra inicial'
);
```

**Retorna:**
```json
{
  "saldo_anterior": 50,
  "saldo_posterior": 150
}
```

## 🎨 Status Visual

### Badges de Status

```
Normal:   estoque > mínimo          🟢 Verde
Baixo:    mínimo ≥ estoque > 50%    🟡 Amarelo
Crítico:  estoque ≤ 50% do mínimo   🔴 Vermelho
```

### Barra de Progresso

```
100%+ ████████████████████ Verde
50-100% ██████████░░░░░░░░░░ Amarelo
<50%    ███░░░░░░░░░░░░░░░░░ Vermelho
```

## 🧪 Como Testar

### 1. Preparação
```bash
# Servidor
npm run dev
http://localhost:3000/estoque
```

### 2. Cadastrar Produto

```bash
# 1. Clicar em "Novo Produto"

# 2. Preencher:
Descrição: Parafuso M8 x 20mm
Código: PARA-M8-20
Unidade: UN (unidade)
Categoria: (selecionar)
Estoque Inicial: 0
Estoque Mínimo: 50
Localização: Prateleira A-12

# 3. Clicar em "Cadastrar Produto"
```

**Resultado:**
- ✅ Toast: "Produto cadastrado com sucesso!"
- ✅ Produto aparece na lista
- ✅ Status: Crítico (se estoque < mínimo)
- ✅ KPIs atualizados

### 3. Movimentar Estoque

#### Entrada (Recebimento)
```bash
# 1. Clicar em "Movimentar" no produto
# 2. Tipo: Entrada ⬆️
# 3. Quantidade: 100
# 4. Observação: "Compra inicial"
# 5. Ver preview: Novo Saldo = 100 UN
# 6. Clicar em "Registrar Movimentação"
```

**Resultado:**
- ✅ Estoque atual = 100 UN
- ✅ Status muda para Normal (se > mínimo)
- ✅ Movimentação registrada no histórico

#### Saída (Consumo)
```bash
# 1. Tipo: Saída ⬇️
# 2. Quantidade: 30
# 3. Observação: "Uso em manutenção"
```

**Resultado:**
- ✅ Estoque atual = 70 UN
- ✅ Saldo validado (não permite negativo)

#### Ajuste (Correção)
```bash
# 1. Tipo: Ajuste Positivo ➕
# 2. Quantidade: 5
# 3. Observação: "Correção de inventário"
```

### 4. Ver Histórico

```bash
# 1. Clicar no ícone 👁️ (olho) no produto
# 2. Ver histórico completo:
   - Data/hora
   - Tipo de movimentação
   - Quantidade (+/-)
   - Saldos (anterior/posterior)
   - Usuário
   - Observação
```

## 📈 Cenários de Teste

### Teste 1: Produto Normal
```
Estoque atual: 100 UN
Estoque mínimo: 50 UN
Status: Normal 🟢
Percentual: 200%
```

### Teste 2: Produto com Estoque Baixo
```
Estoque atual: 60 UN
Estoque mínimo: 100 UN
Status: Baixo 🟡
Percentual: 60%
Alerta: ⚠️ Abaixo do mínimo
```

### Teste 3: Produto Crítico
```
Estoque atual: 20 UN
Estoque mínimo: 100 UN
Status: Crítico 🔴
Percentual: 20%
Alerta: ⚠️ Criticamente abaixo do mínimo
```

### Teste 4: Entrada Automática (Integração)
```
1. Criar pedido de compra
2. Receber mercadoria
3. Verificar que estoque foi atualizado automaticamente
4. Ver movimentação com tipo ENTRADA
5. Observação: "Recebimento automático"
```

### Teste 5: Validação de Saldo
```
Estoque atual: 10 UN
Tentar saída de: 20 UN
Resultado: ❌ "Saldo insuficiente"
Preview mostra: SALDO INSUFICIENTE (vermelho)
Botão bloqueado
```

## 🔒 Segurança

### RLS (Row Level Security)
```sql
-- Produtos
CREATE POLICY "produtos_tenant"
ON produtos FOR ALL
USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- Movimentações
CREATE POLICY "movimentacoes_estoque_tenant"
ON movimentacoes_estoque FOR ALL
USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
```

### Validações
- ✅ Código SKU único por tenant
- ✅ Saldo não pode ficar negativo
- ✅ Quantidade > 0
- ✅ Tipo de movimentação válido
- ✅ Usuário autenticado registrado

## 📊 KPIs e Métricas

Dashboard exibe:

```
┌────────────────┬─────────────────┬──────────────┬────────────┐
│ Total Produtos │ Abaixo Mínimo   │ Crítico      │ Normal     │
├────────────────┼─────────────────┼──────────────┼────────────┤
│      150       │       12        │      5       │    133     │
└────────────────┴─────────────────┴──────────────┴────────────┘
```

### Cálculos:
- **Total**: COUNT(*)
- **Abaixo do Mínimo**: estoque_atual ≤ estoque_minimo_alerta
- **Crítico**: estoque_atual ≤ estoque_minimo_alerta * 0.5
- **Normal**: estoque_atual > estoque_minimo_alerta

## 🚀 Próximas Melhorias (Opcional)

### Fase 2 - Recursos Avançados
- [ ] Inventário/Contagem física
- [ ] Lote e validade
- [ ] Código de barras
- [ ] Múltiplos locais/depósitos
- [ ] Transferência entre locais
- [ ] Reserva de estoque (para pedidos)
- [ ] Custo médio / PEPS / UEPS
- [ ] Relatório de movimentações
- [ ] Export para Excel
- [ ] Alertas por e-mail (estoque baixo)

### Fase 3 - Integrações
- [ ] Importação via CSV
- [ ] Integração com ERP
- [ ] Scanner de código de barras
- [ ] API para consulta externa
- [ ] Dashboard de analytics

## 🐛 Troubleshooting

### Erro: "Saldo insuficiente"
```
Verificar:
1. Estoque atual é suficiente?
2. Tipo de movimentação está correto (SAIDA vs ENTRADA)?
```

### Produto não aparece na lista
```
Verificar:
1. Campo "ativo" está true?
2. Tenant correto?
```

### Entrada automática não funciona
```
Verificar:
1. Recebimento foi confirmado (status COMPLETO/PARCIAL)?
2. Trigger estoque_apos_recebimento existe?
3. Ver logs no Supabase
```

### Histórico vazio
```
Solução:
- Fazer uma movimentação de teste
- Verificar RLS da tabela movimentacoes_estoque
```

## 📚 Referências

- [Gestão de Estoque](https://en.wikipedia.org/wiki/Inventory_management)
- [FIFO/LIFO/PEPS/UEPS](https://pt.wikipedia.org/wiki/FIFO_e_LIFO)
- [PostgreSQL Numeric](https://www.postgresql.org/docs/current/datatype-numeric.html)

## ✅ Conclusão

O módulo de **Estoque** está 100% funcional com:

- ✅ Cadastro completo de produtos
- ✅ Movimentação com 5 tipos
- ✅ Validação de saldo
- ✅ Histórico completo e auditoria
- ✅ Alertas de estoque baixo/crítico
- ✅ **Integração automática com recebimentos**
- ✅ KPIs visuais

**Tempo de implementação:** ~3 horas  
**Complexidade:** Média  
**Pronto para produção:** ✅ Sim

---

**Desenvolvido com ❤️ pelo SupriFlow**
