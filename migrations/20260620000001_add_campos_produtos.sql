-- Adicionar novos campos à tabela produtos
-- Migration: 20260620000001_add_campos_produtos

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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_produtos_marca ON produtos(marca);

-- Comentários nas colunas para documentação
COMMENT ON COLUMN produtos.codigo_barras IS 'Código de barras EAN/UPC do produto';
COMMENT ON COLUMN produtos.ncm IS 'Nomenclatura Comum do Mercosul';
COMMENT ON COLUMN produtos.estoque_maximo IS 'Quantidade máxima recomendada em estoque';
COMMENT ON COLUMN produtos.fornecedor_id IS 'Fornecedor preferencial do produto';
COMMENT ON COLUMN produtos.custo_medio IS 'Custo médio ponderado do produto';
COMMENT ON COLUMN produtos.custo_ultima_compra IS 'Custo da última compra realizada';
COMMENT ON COLUMN produtos.preco_venda IS 'Preço de venda sugerido';
COMMENT ON COLUMN produtos.lote_obrigatorio IS 'Se true, exige número de lote nas movimentações';
COMMENT ON COLUMN produtos.validade_obrigatoria IS 'Se true, exige data de validade nas movimentações';
