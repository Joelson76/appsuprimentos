# Vínculo de Produtos em Requisições, Cotações e Pedidos

## 📋 Visão Geral

A partir de **2026-06-22**, requisições, cotações e pedidos **usam apenas produtos cadastrados** ao invés de entrada livre de texto.

## 🎯 Benefícios

✅ **Padronização:** Todos os documentos usam a mesma base de produtos  
✅ **Rastreabilidade:** Histórico completo de requisições por produto  
✅ **Controle de Estoque:** Validação automática de disponibilidade  
✅ **Análise:** Relatórios de produtos mais requisitados  
✅ **Custo:** Valor estimado preenchido automaticamente  
✅ **Classificação:** Aproveita a classificação de produtos (Diretas/Indiretas/etc)  

---

## 🗄️ Estrutura do Banco de Dados

### Alterações nas Tabelas

#### 1. **itens_requisicao**
```sql
-- Nova coluna
ALTER TABLE itens_requisicao
ADD COLUMN produto_id UUID REFERENCES produtos(id);

-- Descrição agora é opcional (vem do produto)
ALTER TABLE itens_requisicao
ALTER COLUMN descricao DROP NOT NULL;

-- Constraint: deve ter produto_id OU descricao (compatibilidade)
ALTER TABLE itens_requisicao
ADD CONSTRAINT chk_itens_req_produto_ou_descricao
CHECK (produto_id IS NOT NULL OR descricao IS NOT NULL);
```

#### 2. **itens_cotacao**
```sql
-- Mesma estrutura
ALTER TABLE itens_cotacao ADD COLUMN produto_id UUID;
```

#### 3. **itens_pedido (ordens_compra)**
```sql
-- Mesma estrutura
ALTER TABLE itens_pedido ADD COLUMN produto_id UUID;
```

---

## 📊 Views Criadas

### 1. **vw_itens_requisicao_completo**
Combina dados do item com dados do produto:

```sql
SELECT
  ir.*,
  p.descricao AS produto_descricao,
  p.codigo AS produto_codigo,
  p.unidade AS produto_unidade,
  p.estoque_atual AS produto_estoque_atual,
  COALESCE(ir.descricao, p.descricao) AS descricao_final
FROM itens_requisicao ir
LEFT JOIN produtos p ON ir.produto_id = p.id;
```

### 2. **vw_produtos_mais_requisitados**
Análise de produtos mais solicitados:

```sql
SELECT
  p.id, p.descricao, p.codigo, p.classificacao,
  COUNT(DISTINCT ir.requisicao_id) AS total_requisicoes,
  SUM(ir.quantidade) AS quantidade_total,
  AVG(ir.quantidade) AS quantidade_media
FROM produtos p
INNER JOIN itens_requisicao ir ON ir.produto_id = p.id
GROUP BY p.id
ORDER BY total_requisicoes DESC;
```

---

## ⚙️ Funções Auxiliares

### **validar_estoque_requisicao(produto_id, quantidade)**

Valida se há estoque disponível:

```sql
SELECT validar_estoque_requisicao(
  'uuid-do-produto',
  10
);

-- Retorna JSON:
{
  "disponivel": true,
  "estoque_atual": 50,
  "quantidade_solicitada": 10,
  "saldo_apos": 40
}

-- Se não houver estoque:
{
  "disponivel": false,
  "motivo": "Estoque insuficiente. Disponível: 5 UN",
  "deficit": 5
}
```

---

## 💻 Frontend - Componentes

### 1. **SelectorProduto** (Novo Componente)

**Arquivo:** `components/requisicoes/selector-produto.tsx`

**Funcionalidades:**
- Lista todos os produtos ativos
- Exibe código, descrição, estoque e classificação
- Badge de status (Crítico/Baixo/Normal)
- Alerta visual se produto sem estoque
- Auto-completa unidade e valor estimado

**Uso:**
```tsx
import { SelectorProduto } from '@/components/requisicoes/selector-produto'

<SelectorProduto
  value={item.produto_id}
  onChange={(produto) => {
    // produto contém: id, descricao, codigo, unidade, estoque_atual, custo_medio
  }}
  required
/>
```

### 2. **Formulário de Nova Requisição**

**Arquivo:** `app/(dashboard)/requisicoes/nova/page.tsx`

**Mudanças:**
- ❌ Campo "Produto / Serviço" (texto livre) → ✅ Seletor de produtos
- ❌ Campo "Descrição" (texto livre) → ✅ Preenchido automaticamente
- ❌ Campo "Unidade" (select) → ✅ Definido pelo produto (read-only)
- ✅ Valor estimado preenchido com `custo_medio` do produto

**Interface do Item:**
```ts
interface Item {
  produto_id: string           // UUID do produto
  produto_descricao: string    // Copiado do produto
  quantidade: number
  unidade: string              // Copiado do produto
  valor_estimado: number       // Copiado de custo_medio
  observacao: string
}
```

---

## 🚀 Fluxo de Uso

### **Criar Nova Requisição:**

1. Usuário clica em "Nova Requisição"
2. Preenche dados gerais (filial, descrição, urgência)
3. **Adiciona itens:**
   - Seleciona produto do dropdown
   - Sistema preenche automaticamente: descrição, unidade, valor estimado
   - Exibe alerta se estoque baixo/crítico
   - Usuário informa quantidade e observação
4. Salva requisição

### **Validações:**

✅ Produto obrigatório (não aceita mais texto livre)  
✅ Quantidade > 0  
✅ Alerta visual se produto sem estoque  
✅ Unidade vem do produto (não pode alterar)  

---

## 📈 Relatórios Disponíveis

### 1. **Produtos Mais Requisitados**
```sql
SELECT * FROM vw_produtos_mais_requisitados
WHERE tenant_id = 'xxx'
ORDER BY total_requisicoes DESC
LIMIT 10;
```

### 2. **Requisições por Classificação**
```sql
SELECT
  p.classificacao,
  COUNT(DISTINCT ir.requisicao_id) AS total_requisicoes,
  SUM(ir.quantidade * ir.valor_estimado) AS valor_total
FROM itens_requisicao ir
INNER JOIN produtos p ON ir.produto_id = p.id
GROUP BY p.classificacao;
```

### 3. **Taxa de Atendimento de Estoque**
```sql
SELECT
  COUNT(CASE WHEN p.estoque_atual >= ir.quantidade THEN 1 END) AS atendidos,
  COUNT(*) AS total,
  ROUND(
    COUNT(CASE WHEN p.estoque_atual >= ir.quantidade THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) AS taxa_atendimento_pct
FROM itens_requisicao ir
INNER JOIN produtos p ON ir.produto_id = p.id;
```

---

## 🔄 Compatibilidade com Dados Antigos

A migration mantém compatibilidade:

✅ Itens antigos com `descricao` (sem `produto_id`) continuam funcionando  
✅ Constraint permite `produto_id` OU `descricao`  
✅ Novos itens **devem** ter `produto_id`  

---

## 📁 Arquivos Modificados/Criados

### **Migrations:**
- `20260622000001_vincular_produtos_requisicoes.sql`

### **Componentes:**
- `components/requisicoes/selector-produto.tsx` (NOVO)

### **Páginas:**
- `app/(dashboard)/requisicoes/nova/page.tsx` (ATUALIZADO)

### **Próximos (TODO):**
- `app/(dashboard)/cotacoes/nova/page.tsx`
- `app/(dashboard)/pedidos/novo/page.tsx`

---

## ✅ Próximos Passos

1. **Aplicar Migration no Supabase**
2. **Testar Formulário de Requisição**
3. **Atualizar Formulário de Cotação** (mesma lógica)
4. **Atualizar Formulário de Pedido** (mesma lógica)
5. **Criar Relatório de Produtos Mais Requisitados**
6. **Criar Dashboard de Análise de Demanda**

---

## 🎨 Preview do Seletor de Produtos

```
┌─────────────────────────────────────────────┐
│ Produto *                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ 📦 [PARA-M8] Parafuso M8 x 20mm      ▼ │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Opções no dropdown:]                       │
│ ┌─────────────────────────────────────────┐ │
│ │ 📦 [PARA-M8] Parafuso M8 x 20mm         │ │
│ │    Estoque: 1500 UN • R$ 0.50           │ │
│ │    🏭 COMPRAS_DIRETAS                   │ │
│ ├─────────────────────────────────────────┤ │
│ │ 📦 [GRAX-IND] Graxa Industrial 1kg      │ │
│ │    Estoque: 25 KG • R$ 45.00   ⚠ Baixo │ │
│ │    🔧 COMPRAS_INDIRETAS                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ⚠ Estoque baixo! Disponível: 25 KG         │
└─────────────────────────────────────────────┘
```
