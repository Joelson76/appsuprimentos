# Classificação de Produtos - SupriFlow

## 📋 Visão Geral

A partir de **2026-06-22**, o SupriFlow suporta **classificação de produtos** para melhor gestão e análise de compras.

## 🏷️ Tipos de Classificação

### 1. 🏭 **Compras Diretas**
**Descrição:** Produtos que entram diretamente na produção ou revenda  
**Exemplos:**
- Matérias-primas
- Componentes de produção
- Mercadorias para revenda
- Embalagens primárias

**Quando usar:** Para produtos que fazem parte do produto final ou são vendidos diretamente.

---

### 2. 🔧 **Compras Indiretas (MRO)**
**Descrição:** Insumos operacionais (Manutenção, Reparo, Operação)  
**Exemplos:**
- Material de limpeza
- Material de escritório
- Ferramentas
- Equipamentos de TI
- Uniformes
- Material de manutenção

**Quando usar:** Para produtos necessários para operação mas que não entram no produto final.

---

### 3. 🏗️ **Ativos Imobilizados**
**Descrição:** Bens de capital para investimento  
**Exemplos:**
- Máquinas e equipamentos
- Veículos
- Móveis e utensílios
- Instalações
- Equipamentos de informática (uso prolongado)

**Quando usar:** Para bens duráveis que serão depreciados ao longo do tempo.

---

### 4. ⚡ **Uso Imediato**
**Descrição:** Consumo direto sem estocagem prolongada  
**Exemplos:**
- Serviços
- Pequenos valores consumíveis
- Produtos de uso único
- Itens de baixo valor

**Quando usar:** Para produtos consumidos imediatamente após compra.

---

## 🗄️ Estrutura do Banco de Dados

### ENUM criado:
```sql
CREATE TYPE classificacao_produto AS ENUM (
  'COMPRAS_DIRETAS',
  'COMPRAS_INDIRETAS',
  'ATIVOS_IMOBILIZADOS',
  'USO_IMEDIATO'
);
```

### Coluna adicionada em `produtos`:
```sql
ALTER TABLE produtos
ADD COLUMN classificacao classificacao_produto;
```

### View criada:
```sql
CREATE VIEW vw_produtos_por_classificacao AS
SELECT
  tenant_id,
  classificacao,
  COUNT(id) AS total_produtos,
  COUNT(CASE WHEN ativo = true THEN 1 END) AS produtos_ativos,
  COUNT(CASE WHEN estoque_atual > 0 THEN 1 END) AS produtos_com_estoque,
  SUM(estoque_atual) AS total_estoque,
  SUM(custo_medio * estoque_atual) AS valor_total_estoque
FROM produtos
WHERE classificacao IS NOT NULL
GROUP BY tenant_id, classificacao;
```

---

## 💻 Implementação no Frontend

### 1. **Formulário de Produto**
Arquivo: `components/estoque/formulario-produto.tsx`

**Select de Classificação:**
```tsx
<Select
  value={formData.classificacao}
  onValueChange={(value) => setFormData({ ...formData, classificacao: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="COMPRAS_DIRETAS">
      <div className="flex flex-col">
        <span className="font-medium">Compras Diretas</span>
        <span className="text-xs text-muted-foreground">
          Produtos para produção ou revenda
        </span>
      </div>
    </SelectItem>
    {/* ... outros itens */}
  </SelectContent>
</Select>
```

### 2. **Lista de Produtos**
Arquivo: `app/(dashboard)/estoque/page.tsx`

**Badge visual por classificação:**
```tsx
{produto.classificacao ? (
  <Badge className={classificacaoColors[produto.classificacao]}>
    {classificacaoLabels[produto.classificacao]}
  </Badge>
) : (
  <span className="text-muted-foreground text-sm">-</span>
)}
```

**Cores definidas:**
- 🟦 **Compras Diretas:** `bg-blue-100 text-blue-800`
- 🟪 **Compras Indiretas:** `bg-purple-100 text-purple-800`
- 🟧 **Ativos Imobilizados:** `bg-orange-100 text-orange-800`
- 🟩 **Uso Imediato:** `bg-teal-100 text-teal-800`

### 3. **Relatório de Classificação**
Arquivo: `app/(dashboard)/relatorios/classificacao-produtos/page.tsx`

**Métricas disponíveis:**
- Total de produtos por classificação
- Produtos com estoque
- Quantidade total em estoque
- Valor total do estoque
- Percentual do total

---

## 📊 Casos de Uso

### Análise Financeira
```sql
-- Valor total em estoque por classificação
SELECT 
  classificacao,
  SUM(custo_medio * estoque_atual) as valor_total
FROM produtos
WHERE ativo = true AND estoque_atual > 0
GROUP BY classificacao
ORDER BY valor_total DESC;
```

### Relatório Gerencial
```sql
-- Top 10 produtos de Compras Diretas por valor
SELECT 
  descricao,
  custo_medio * estoque_atual as valor_estoque
FROM produtos
WHERE classificacao = 'COMPRAS_DIRETAS'
  AND ativo = true
  AND estoque_atual > 0
ORDER BY valor_estoque DESC
LIMIT 10;
```

### Auditoria de Classificação
```sql
-- Produtos sem classificação
SELECT 
  codigo, 
  descricao, 
  categoria_id
FROM produtos
WHERE classificacao IS NULL
  AND ativo = true;
```

---

## 🚀 Como Aplicar

### 1. Aplicar Migration no Supabase
```bash
# Executar no SQL Editor do Supabase
-- Copiar conteúdo de:
supabase/migrations/20260622000000_classificacao_produtos.sql
```

### 2. Deploy do Frontend
```bash
git add .
git commit -m "feat: add product classification system (Direct/Indirect Purchases, Fixed Assets, Immediate Use)"
git push
```

### 3. Classificar Produtos Existentes
Após aplicar a migration, classificar manualmente os produtos cadastrados:

```sql
-- Exemplo: classificar produtos de uma categoria específica
UPDATE produtos
SET classificacao = 'COMPRAS_DIRETAS'
WHERE categoria_id IN (
  SELECT id FROM categorias WHERE nome ILIKE '%materia%prima%'
);
```

---

## ✅ Benefícios

1. **Gestão Estratégica:** Separar compras diretas (core business) de indiretas (suporte)
2. **Controle Financeiro:** Rastrear investimentos em ativos vs. despesas operacionais
3. **Análise de Custos:** Identificar onde está concentrado o capital de giro
4. **Compliance:** Facilitar auditoria e relatórios contábeis
5. **KPIs:** Métricas específicas por tipo de compra

---

## 📈 Próximos Passos (Sugestões)

- [ ] Dashboard específico por classificação
- [ ] Alertas diferenciados por tipo (ex: ativos com depreciação)
- [ ] Relatórios de curva ABC por classificação
- [ ] Integração com contabilidade (centros de custo diferentes)
- [ ] Workflow de aprovação baseado em classificação

---

## 🔗 Arquivos Relacionados

**Migration:**
- `supabase/migrations/20260622000000_classificacao_produtos.sql`

**Frontend:**
- `components/estoque/formulario-produto.tsx`
- `app/(dashboard)/estoque/page.tsx`
- `app/(dashboard)/relatorios/classificacao-produtos/page.tsx`

**Documentação:**
- `CLAUDE.md` (atualizar com a nova funcionalidade)
