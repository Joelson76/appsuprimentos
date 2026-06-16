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
        error: 'Limite de pedidos atingido',
        detalhes: status.mensagem,
        usado: status.usado,
        limite: status.limite,
        action_required: 'upgrade',
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
        error: 'Limite de usuários atingido',
        detalhes: status.mensagem,
        usado: status.usado,
        limite: status.limite,
        action_required: 'upgrade',
      },
      { status: 403 }
    )
  }

  return null
}
