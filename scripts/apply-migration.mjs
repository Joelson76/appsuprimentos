#!/usr/bin/env node

/**
 * Script para aplicar migrations SQL ao Supabase
 * Uso: node scripts/apply-migration.mjs
 */

import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

// Construir connection string do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrada')
  process.exit(1)
}

// Extrair o project ref da URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('❌ Não foi possível extrair o project ref da URL')
  process.exit(1)
}

// Connection string do Supabase
// Formato: postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
console.log('⚠️  Para aplicar migrations ao Supabase, você precisa:')
console.log('')
console.log('1️⃣  Acessar o Supabase Dashboard:')
console.log(`   https://supabase.com/dashboard/project/${projectRef}/editor`)
console.log('')
console.log('2️⃣  Abrir o SQL Editor e executar:')
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`
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

-- Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
AND table_schema = 'public'
ORDER BY ordinal_position;
`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('3️⃣  Clique em "RUN" para executar')
console.log('')
console.log('✅ Após executar, os novos campos estarão disponíveis!')
