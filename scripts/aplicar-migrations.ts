import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Carregar .env.local
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function aplicarMigrations() {
  console.log('🚀 Aplicando migrations...\n')

  const sqlPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    'APLICAR_MANUALMENTE.sql'
  )

  const sql = fs.readFileSync(sqlPath, 'utf-8')

  // Dividir por comentários de seção
  const sections = sql.split('-- ==========================================')

  for (const section of sections) {
    if (section.trim().length === 0) continue

    const lines = section.trim().split('\n')
    const title = lines[0]

    if (title.includes('APLICAR') || title.includes('Migration:')) {
      console.log(`📝 ${title.replace(/^--\s*/, '')}`)
      continue
    }

    // Pegar o SQL real (pular comentários)
    const sqlCommands = section
      .split('\n')
      .filter((line) => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')

    if (sqlCommands.trim().length === 0) continue

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: sqlCommands })

      if (error) {
        console.error(`❌ Erro:`, error.message)
      } else {
        console.log(`✅ Aplicado com sucesso`)
      }
    } catch (err) {
      console.error(`❌ Erro ao executar:`, err)
    }
  }

  console.log('\n✨ Migrations aplicadas!')
}

aplicarMigrations()
