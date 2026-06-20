import { createClient } from '@/lib/supabase/server'
import { enviarAlertaEstoqueBaixo } from '@/lib/email-service'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API para enviar alertas de estoque baixo
 * Pode ser chamada manualmente ou via cron job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação (ou validar token de cron)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Se não houver usuário, verificar se é chamada de cron (via header)
    const cronSecret = request.headers.get('x-cron-secret')
    if (!user && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Se for usuário normal, verificar tenant
    let tenantId: string | null = null
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      tenantId = profile?.tenant_id || null
    }

    // Buscar produtos com estoque baixo
    const query = supabase
      .from('produtos')
      .select(
        `
        id,
        descricao,
        estoque_atual,
        estoque_minimo_alerta,
        unidade,
        tenant_id,
        tenant:tenants (nome_empresa)
      `
      )
      .eq('ativo', true)
      .not('estoque_minimo_alerta', 'is', null)

    // Se for usuário específico, filtrar por tenant
    if (tenantId) {
      query.eq('tenant_id', tenantId)
    }

    const { data: produtos } = await query

    if (!produtos || produtos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum produto com configuração de alerta',
      })
    }

    // Filtrar produtos com estoque abaixo do mínimo
    const produtosBaixos = produtos.filter(
      (p: any) => Number(p.estoque_atual) <= Number(p.estoque_minimo_alerta)
    )

    if (produtosBaixos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum produto com estoque baixo',
      })
    }

    const alertasEnviados: string[] = []
    const erros: string[] = []

    // Agrupar por tenant e enviar alertas
    const porTenant = produtosBaixos.reduce((acc: any, produto: any) => {
      const tid = produto.tenant_id
      if (!acc[tid]) acc[tid] = []
      acc[tid].push(produto)
      return acc
    }, {})

    for (const [tid, prods] of Object.entries(porTenant) as [string, any[]][]) {
      try {
        // Buscar emails dos admins do tenant
        const { data: admins } = await supabase
          .from('profiles')
          .select('email')
          .eq('tenant_id', tid)
          .in('perfil', ['SUPER_ADMIN', 'ADMIN', 'GESTOR'])

        const emailsDestinatarios =
          admins?.map((a: any) => a.email).filter(Boolean) || []

        if (emailsDestinatarios.length === 0) {
          erros.push(`Tenant ${tid}: Nenhum admin com e-mail`)
          continue
        }

        // Enviar um alerta para cada produto
        for (const produto of prods) {
          try {
            await enviarAlertaEstoqueBaixo({
              tenantId: tid,
              emailsDestinatarios,
              nomeEmpresa: produto.tenant?.nome_empresa || 'Sua Empresa',
              produtoNome: produto.descricao,
              estoqueAtual: `${Number(produto.estoque_atual).toFixed(3)} ${produto.unidade}`,
              estoqueMinimo: `${Number(produto.estoque_minimo_alerta).toFixed(3)} ${produto.unidade}`,
            })

            alertasEnviados.push(
              `${produto.descricao} (${emailsDestinatarios.length} destinatários)`
            )
          } catch (error: any) {
            erros.push(`${produto.descricao}: ${error.message}`)
          }
        }
      } catch (error: any) {
        erros.push(`Tenant ${tid}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      alertasEnviados: alertasEnviados.length,
      produtosComEstoqueBaixo: produtosBaixos.length,
      detalhes: alertasEnviados,
      erros: erros.length > 0 ? erros : undefined,
    })
  } catch (error: any) {
    console.error('Erro ao enviar alertas de estoque:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar alertas',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
