#!/usr/bin/env node

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Ler o SQL da migration
const migrationSQL = readFileSync('./migrations/20260620000001_add_campos_produtos.sql', 'utf-8')

console.log('🚀 Aplicando migration: 20260620000001_add_campos_produtos.sql')
console.log('📄 SQL:', migrationSQL.substring(0, 200) + '...')

try {
  const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

  if (error) {
    console.error('❌ Erro ao aplicar migration:', error)
    process.exit(1)
  }

  console.log('✅ Migration aplicada com sucesso!')
  console.log('\n📋 Verificando estrutura da tabela produtos...')

  // Verificar as colunas adicionadas
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'produtos')
    .eq('table_schema', 'public')
    .order('ordinal_position')

  if (columnsError) {
    console.error('Erro ao verificar colunas:', columnsError)
  } else {
    console.table(columns)
  }

} catch (err) {
  console.error('❌ Erro inesperado:', err)
  process.exit(1)
}
