import { NextResponse } from 'next/server'
import { verificarLimitePedidos, verificarLimiteUsuarios } from '@/lib/validacao-limites'

/**
 * Middleware para validar limite de pedidos antes de criar
 * Use nas APIs de criação de pedidos
 */
export async function validarLimitePedidosMiddleware(tenantId: string) {
  const status = await verificarLimitePedidos(tenantId)

  if (!status.dentro_limite) {
    return NextResponse.json(
      {
        error: 'LIMITE_ATINGIDO',
        tipo: 'pedidos',
        mensagem: 'Limite de pedidos atingido',
        descricao: status.mensagem,
        detalhes: {
          usado: status.usado,
          limite: status.limite,
          percentual: status.percentual,
        },
        action_required: 'upgrade',
        upgrade_url: '/configuracoes/planos',
        sugestao_plano: status.limite === 50 ? 'PROFISSIONAL' : 'ENTERPRISE',
      },
      { status: 403 }
    )
  }

  return null // Permite continuar
}

/**
 * Middleware para validar limite de usuários antes de criar
 */
export async function validarLimiteUsuariosMiddleware(tenantId: string) {
  const status = await verificarLimiteUsuarios(tenantId)

  if (!status.dentro_limite) {
    return NextResponse.json(
      {
        error: 'LIMITE_ATINGIDO',
        tipo: 'usuarios',
        mensagem: 'Limite de usuários atingido',
        descricao: status.mensagem,
        detalhes: {
          usado: status.usado,
          limite: status.limite,
          percentual: status.percentual,
        },
        action_required: 'upgrade',
        upgrade_url: '/configuracoes/planos',
        sugestao_plano: status.limite === 3 ? 'PROFISSIONAL' : 'ENTERPRISE',
      },
      { status: 403 }
    )
  }

  return null
}
