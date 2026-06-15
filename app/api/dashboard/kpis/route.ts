import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Busca KPIs consolidados
    const { data: kpis, error: kpisError } = await supabase
      .from('vw_dashboard_kpis')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (kpisError) {
      return NextResponse.json({ error: kpisError.message }, { status: 500 })
    }

    // Busca evolução mensal
    const { data: evolucao, error: evolucaoError } = await supabase
      .from('vw_evolucao_compras_mensal')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('mes', { ascending: false })
      .limit(12)

    // Busca top fornecedores
    const { data: topFornecedores, error: topFornError } = await supabase
      .from('vw_top_fornecedores')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .limit(10)

    // Busca produtos mais comprados
    const { data: topProdutos, error: topProdError } = await supabase
      .from('vw_produtos_mais_comprados')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .limit(10)

    // Busca saving
    const { data: saving, error: savingError } = await supabase
      .from('vw_saving_cotacoes')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('mes', { ascending: false })
      .limit(6)

    // Busca categorias
    const { data: categorias, error: catError } = await supabase
      .from('vw_categorias_compras')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .limit(10)

    return NextResponse.json({
      kpis,
      evolucao: evolucao || [],
      top_fornecedores: topFornecedores || [],
      top_produtos: topProdutos || [],
      saving: saving || [],
      categorias: categorias || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
