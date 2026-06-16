import { createClient } from '@supabase/supabase-js'

// Cliente com service_role para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface LimitesPlano {
  usuarios: number
  pedidos_mes: number
  fornecedores: number
  produtos: number
}

export interface StatusLimites {
  dentro_limite: boolean
  usado: number
  limite: number
  percentual: number
  mensagem?: string
}

/**
 * Verifica se o tenant pode criar mais pedidos no mês atual
 */
export async function verificarLimitePedidos(
  tenantId: string
): Promise<StatusLimites> {
  try {
    // 1. Buscar plano ativo do tenant
    const { data: assinatura, error: assinaturaError } = await supabaseAdmin
      .from('assinaturas')
      .select(`
        plano,
        ativa,
        planos:plano (
          limite_pos_mes
        )
      `)
      .eq('tenant_id', tenantId)
      .single()

    if (assinaturaError || !assinatura) {
      return {
        dentro_limite: false,
        usado: 0,
        limite: 0,
        percentual: 0,
        mensagem: 'Assinatura não encontrada',
      }
    }

    // Verifica se assinatura está ativa
    if (!assinatura.ativa) {
      return {
        dentro_limite: false,
        usado: 0,
        limite: 0,
        percentual: 0,
        mensagem: 'Assinatura inativa. Regularize seu pagamento.',
      }
    }

    // @ts-ignore
    const limitePedidosMes = assinatura.planos?.limite_pos_mes || 0

    // Se limite = -1, é ilimitado
    if (limitePedidosMes === -1) {
      return {
        dentro_limite: true,
        usado: 0,
        limite: -1,
        percentual: 0,
        mensagem: 'Pedidos ilimitados',
      }
    }

    // 2. Contar pedidos criados no mês atual
    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    primeiroDiaMes.setHours(0, 0, 0, 0)

    const { count: pedidosUsados, error: countError } = await supabaseAdmin
      .from('ordens_compra')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('criado_em', primeiroDiaMes.toISOString())
      .not('status', 'in', '(CANCELADA,RASCUNHO)') // Não conta cancelados/rascunhos

    if (countError) {
      console.error('Erro ao contar pedidos:', countError)
      return {
        dentro_limite: false,
        usado: 0,
        limite: limitePedidosMes,
        percentual: 0,
        mensagem: 'Erro ao verificar limite',
      }
    }

    const usado = pedidosUsados || 0
    const percentual = (usado / limitePedidosMes) * 100
    const dentrodoLimite = usado < limitePedidosMes

    return {
      dentro_limite: dentrodoLimite,
      usado,
      limite: limitePedidosMes,
      percentual: Math.round(percentual),
      mensagem: dentrodoLimite
        ? `${usado}/${limitePedidosMes} pedidos usados este mês`
        : `Limite atingido! Você já criou ${usado}/${limitePedidosMes} pedidos este mês. Faça upgrade do seu plano.`,
    }
  } catch (error) {
    console.error('Erro ao verificar limite de pedidos:', error)
    return {
      dentro_limite: false,
      usado: 0,
      limite: 0,
      percentual: 0,
      mensagem: 'Erro ao verificar limite',
    }
  }
}

/**
 * Verifica se o tenant pode adicionar mais usuários
 */
export async function verificarLimiteUsuarios(
  tenantId: string
): Promise<StatusLimites> {
  try {
    // Buscar plano
    const { data: assinatura } = await supabaseAdmin
      .from('assinaturas')
      .select(`
        planos:plano (
          limite_usuarios
        )
      `)
      .eq('tenant_id', tenantId)
      .single()

    // @ts-ignore
    const limiteUsuarios = assinatura?.planos?.limite_usuarios || 0

    if (limiteUsuarios === -1) {
      return {
        dentro_limite: true,
        usado: 0,
        limite: -1,
        percentual: 0,
        mensagem: 'Usuários ilimitados',
      }
    }

    // Contar usuários ativos
    const { count: usuariosUsados } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('ativo', true)

    const usado = usuariosUsados || 0
    const percentual = (usado / limiteUsuarios) * 100
    const dentrodoLimite = usado < limiteUsuarios

    return {
      dentro_limite: dentrodoLimite,
      usado,
      limite: limiteUsuarios,
      percentual: Math.round(percentual),
      mensagem: dentrodoLimite
        ? `${usado}/${limiteUsuarios} usuários`
        : `Limite atingido! Você tem ${usado}/${limiteUsuarios} usuários. Faça upgrade.`,
    }
  } catch (error) {
    console.error('Erro ao verificar limite de usuários:', error)
    return {
      dentro_limite: false,
      usado: 0,
      limite: 0,
      percentual: 0,
      mensagem: 'Erro ao verificar limite',
    }
  }
}

/**
 * Verifica se o tenant pode adicionar mais fornecedores
 */
export async function verificarLimiteFornecedores(
  tenantId: string
): Promise<StatusLimites> {
  try {
    const { data: assinatura } = await supabaseAdmin
      .from('assinaturas')
      .select(`
        planos:plano (
          limites
        )
      `)
      .eq('tenant_id', tenantId)
      .single()

    // @ts-ignore
    const limites = assinatura?.planos?.limites as any
    const limiteFornecedores = limites?.fornecedores || 999999

    if (limiteFornecedores >= 999999) {
      return {
        dentro_limite: true,
        usado: 0,
        limite: -1,
        percentual: 0,
        mensagem: 'Fornecedores ilimitados',
      }
    }

    const { count: fornecedoresUsados } = await supabaseAdmin
      .from('fornecedores')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    const usado = fornecedoresUsados || 0
    const dentrodoLimite = usado < limiteFornecedores

    return {
      dentro_limite: dentrodoLimite,
      usado,
      limite: limiteFornecedores,
      percentual: Math.round((usado / limiteFornecedores) * 100),
      mensagem: dentrodoLimite
        ? `${usado}/${limiteFornecedores} fornecedores`
        : `Limite atingido! Faça upgrade.`,
    }
  } catch (error) {
    return {
      dentro_limite: true, // Em caso de erro, permite continuar
      usado: 0,
      limite: 0,
      percentual: 0,
    }
  }
}
