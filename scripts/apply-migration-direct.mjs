#!/usr/bin/env node

/**
 * Aplica a migration de produtos diretamente via Supabase REST API
 */

import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://rmypzuhbfechbxuikyht.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Variável SUPABASE_SERVICE_ROLE_KEY não encontrada')
  console.log('💡 Carregue do .env.local com: export $(cat .env.local | xargs)')
  process.exit(1)
}

console.log('🚀 Aplicando migration: add_campos_produtos\n')

// SQL da migration
const sql = `
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

-- Comentários
COMMENT ON COLUMN produtos.codigo_barras IS 'Código de barras EAN/UPC do produto';
COMMENT ON COLUMN produtos.ncm IS 'Nomenclatura Comum do Mercosul';
COMMENT ON COLUMN produtos.estoque_maximo IS 'Quantidade máxima recomendada em estoque';
COMMENT ON COLUMN produtos.fornecedor_id IS 'Fornecedor preferencial do produto';
COMMENT ON COLUMN produtos.custo_medio IS 'Custo médio ponderado do produto';
COMMENT ON COLUMN produtos.custo_ultima_compra IS 'Custo da última compra realizada';
COMMENT ON COLUMN produtos.preco_venda IS 'Preço de venda sugerido';
COMMENT ON COLUMN produtos.lote_obrigatorio IS 'Se true, exige número de lote nas movimentações';
COMMENT ON COLUMN produtos.validade_obrigatoria IS 'Se true, exige data de validade nas movimentações';
`

try {
  console.log('📡 Executando SQL via REST API...\n')

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql })
  })

  if (!response.ok) {
    console.error('❌ Erro na requisição:', response.status, response.statusText)
    const text = await response.text()
    console.error('Resposta:', text)
    process.exit(1)
  }

  const result = await response.json()
  console.log('✅ Migration aplicada com sucesso!\n')

  // Verificar colunas
  console.log('📋 Verificando colunas da tabela produtos...\n')

  const checkResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/check_columns`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({})
    }
  )

  if (checkResponse.ok) {
    const columns = await checkResponse.json()
    console.table(columns)
  }

  console.log('\n🎉 Pronto! Agora você pode:')
  console.log('   1. Acessar http://localhost:3000/estoque')
  console.log('   2. Clicar no ícone do olho 👁️ em qualquer produto')
  console.log('   3. Ver TODOS os detalhes do produto!\n')

} catch (error) {
  console.error('❌ Erro ao aplicar migration:', error.message)
  process.exit(1)
}
