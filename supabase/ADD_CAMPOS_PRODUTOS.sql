-- Adicionar novos campos à tabela produtos

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

-- Verificar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
AND table_schema = 'public'
ORDER BY ordinal_position;
