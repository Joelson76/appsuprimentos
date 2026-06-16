import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { validarLimitePedidosMiddleware } from '@/lib/middleware/validar-limites'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    // ⚠️ VALIDAÇÃO DE LIMITE - BLOQUEIA SE ATINGIU
    const limiteError = await validarLimitePedidosMiddleware(profile.tenant_id)
    if (limiteError) {
      return limiteError // Retorna 403 com mensagem de upgrade
    }

    // Continua criando o pedido normalmente...
    const { data, error } = await supabase
      .from('ordens_compra')
      .insert({
        tenant_id: profile.tenant_id,
        ...body,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
