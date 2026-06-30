import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Cliente Supabase com service_role (bypassa RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Buscar todos os tenants com contagem de produtos
    const { data: tenants, error } = await supabaseAdmin
      .from('tenants')
      .select(`
        id,
        nome,
        cnpj,
        status,
        criado_em
      `)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('Erro ao buscar tenants:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar tenants' },
        { status: 500 }
      )
    }

    // Para cada tenant, contar produtos
    const tenantsWithProducts = await Promise.all(
      tenants.map(async (tenant) => {
        const { count } = await supabaseAdmin
          .from('produtos')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)

        return {
          ...tenant,
          total_produtos: count || 0,
        }
      })
    )

    return NextResponse.json({
      tenants: tenantsWithProducts,
    })
  } catch (error) {
    console.error('Erro na API debug/tenants:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
