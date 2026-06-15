import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const tipoDocumento = searchParams.get('tipo_documento')
    const documentoId = searchParams.get('documento_id')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    let query = supabase
      .from('vw_aprovacoes_pendentes')
      .select('*')

    if (tipoDocumento) {
      query = query.eq('tipo_documento', tipoDocumento)
    }

    if (documentoId) {
      query = query.eq('documento_id', documentoId)
    } else {
      // Se não especificou documento, mostra apenas aprovações do usuário
      query = query.or(`aprovador_id.eq.${user.id},perfil_requerido.eq.${user.user_metadata?.perfil}`)
    }

    const { data, error } = await query.order('criado_em', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { aprovacao_id, acao, justificativa } = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Chama função PostgreSQL para processar aprovação
    const { data, error } = await supabaseAdmin.rpc('processar_aprovacao', {
      p_aprovacao_id: aprovacao_id,
      p_usuario_id: user.id,
      p_acao: acao,
      p_justificativa: justificativa
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
