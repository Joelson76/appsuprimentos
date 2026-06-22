import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se já existe short link para este token
    const { data: existing } = await supabase
      .from('cotacao_short_links')
      .select('short_code')
      .eq('token_original', token)
      .single()

    if (existing) {
      return NextResponse.json({
        shortCode: existing.short_code,
        shortUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/c/${existing.short_code}`,
        existing: true,
      })
    }

    // Criar novo short link
    const { data, error } = await supabase.rpc('criar_short_link_para_token', {
      p_token_original: token,
    })

    if (error) {
      console.error('Erro ao criar short link:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      shortCode: data,
      shortUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/c/${data}`,
      existing: false,
    })
  } catch (error: any) {
    console.error('Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
