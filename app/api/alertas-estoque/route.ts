import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ABERTO'

    const { data, error } = await supabase
      .from('vw_produtos_criticos')
      .select('*')
      .order('prioridade', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Resolver alerta
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { alerta_id, status, requisicao_id } = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { error } = await supabase
      .from('alertas_estoque')
      .update({
        status,
        resolvido_em: status === 'RESOLVIDO' ? new Date().toISOString() : null,
        resolvido_por: status === 'RESOLVIDO' ? user.id : null,
        requisicao_id: requisicao_id || null
      })
      .eq('id', alerta_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
