import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const produtoId = searchParams.get('produto_id')
    const fornecedorId = searchParams.get('fornecedor_id')

    let query = supabase
      .from('vw_comparativo_precos')
      .select('*')
      .eq('ranking_recente', 1) // Só preço mais recente de cada fornecedor

    if (produtoId) {
      query = query.eq('produto_id', produtoId)
    }

    if (fornecedorId) {
      query = query.eq('fornecedor_id', fornecedorId)
    }

    const { data, error } = await query.order('preco_unitario', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
