# 🚀 Aplicar Migration de Produtos

## ⚠️ IMPORTANTE: Execute este SQL no Supabase Dashboard

Os campos adicionais de produtos ainda não foram aplicados ao banco de dados.
Por isso, quando você clica no "olho" para ver detalhes do produto, apenas alguns dados são carregados.

### Passo a Passo:

1. **Acesse o SQL Editor do Supabase:**
   - https://supabase.com/dashboard/project/rmypzuhbfechbxuikyht/editor

2. **Copie e cole o SQL abaixo:**

```sql
-- ============================================
-- Migration: Adicionar campos à tabela produtos
-- Data: 2026-06-20
-- ============================================

-- Adicionar novos campos
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS codigo_barras TEXT,
  ADD COLUMN IF NOT EXISTS ncm TEXT,
  ADD COLUMN IF NOT EXISTS estoque_maximo NUMERIC(15,3),
  ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES fornecedores(id),
  ADD COLUMN IF NOT EXISTS custo_medio NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS custo_ultima_compra NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS preco_venda NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS marca TEXT,
  ADD COLUMN IF NOT EXISTS modelo TEXT,
  ADD COLUMN IF NOT EXISTS especificacoes TEXT,
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS peso NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS altura NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS largura NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS profundidade NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS lote_obrigatorio BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS validade_obrigatoria BOOLEAN DEFAULT FALSE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_produtos_marca ON produtos(marca);

-- Adicionar comentários nas colunas (documentação)
COMMENT ON COLUMN produtos.codigo_barras IS 'Código de barras EAN/UPC do produto';
COMMENT ON COLUMN produtos.ncm IS 'Nomenclatura Comum do Mercosul';
COMMENT ON COLUMN produtos.estoque_maximo IS 'Quantidade máxima recomendada em estoque';
COMMENT ON COLUMN produtos.fornecedor_id IS 'Fornecedor preferencial do produto';
COMMENT ON COLUMN produtos.custo_medio IS 'Custo médio ponderado do produto';
COMMENT ON COLUMN produtos.custo_ultima_compra IS 'Custo da última compra realizada';
COMMENT ON COLUMN produtos.preco_venda IS 'Preço de venda sugerido';
COMMENT ON COLUMN produtos.lote_obrigatorio IS 'Se true, exige número de lote nas movimentações';
COMMENT ON COLUMN produtos.validade_obrigatoria IS 'Se true, exige data de validade nas movimentações';

-- Verificar resultado (opcional - para confirmar que funcionou)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
AND table_schema = 'public'
ORDER BY ordinal_position;
```

3. **Clique em "RUN" ou pressione Ctrl+Enter**

4. **Aguarde a confirmação:**
   - Você deve ver uma mensagem de sucesso
   - A query de verificação mostrará todos os campos da tabela produtos

5. **Teste novamente:**
   - Volte para http://localhost:3000/estoque
   - Clique no ícone do olho 👁️ em qualquer produto
   - Agora TODOS os dados devem aparecer!

---

## 📋 Campos que serão adicionados:

### Identificação:
- ✅ `codigo_barras` - Código de barras EAN/UPC
- ✅ `ncm` - NCM fiscal

### Financeiro:
- ✅ `custo_medio` - Custo médio ponderado
- ✅ `custo_ultima_compra` - Valor da última compra
- ✅ `preco_venda` - Preço de venda sugerido

### Fornecedor:
- ✅ `fornecedor_id` - Fornecedor preferencial

### Estoque:
- ✅ `estoque_maximo` - Quantidade máxima

### Características:
- ✅ `marca` - Marca do produto
- ✅ `modelo` - Modelo do produto
- ✅ `especificacoes` - Especificações técnicas (texto longo)
- ✅ `observacoes` - Observações gerais

### Dimensões:
- ✅ `peso` - Peso em kg
- ✅ `altura` - Altura em cm
- ✅ `largura` - Largura em cm
- ✅ `profundidade` - Profundidade em cm

### Controles:
- ✅ `lote_obrigatorio` - Controle de lote obrigatório?
- ✅ `validade_obrigatoria` - Controle de validade obrigatório?

---

## 🎯 Depois de aplicar:

A página de detalhes do produto (`/estoque/[id]`) exibirá:

1. **Card de Informações do Produto**: código, código de barras, marca, modelo, NCM
2. **Card de Estoque**: estoque atual, mínimo, máximo
3. **Card Financeiro**: custo médio, última compra, preço venda, margem de lucro
4. **Card de Dimensões**: peso, altura, largura, profundidade
5. **Cards de Texto**: especificações técnicas e observações

Tudo isso já está programado na página, só faltava os campos no banco! 🚀
