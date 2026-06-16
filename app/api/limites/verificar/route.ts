import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  verificarLimitePedidos,
  verificarLimiteUsuarios,
  verificarLimiteFornecedores,
} from '@/lib/validacao-limites'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // pedidos, usuarios, fornecedores

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

    const tenantId = profile.tenant_id

    // Se não especificar tipo, retorna todos
    if (!tipo || tipo === 'todos') {
      const [pedidos, usuarios, fornecedores] = await Promise.all([
        verificarLimitePedidos(tenantId),
        verificarLimiteUsuarios(tenantId),
        verificarLimiteFornecedores(tenantId),
      ])

      return NextResponse.json({
        pedidos,
        usuarios,
        fornecedores,
      })
    }

    // Verificar tipo específico
    let resultado
    switch (tipo) {
      case 'pedidos':
        resultado = await verificarLimitePedidos(tenantId)
        break
      case 'usuarios':
        resultado = await verificarLimiteUsuarios(tenantId)
        break
      case 'fornecedores':
        resultado = await verificarLimiteFornecedores(tenantId)
        break
      default:
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('Erro ao verificar limites:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
