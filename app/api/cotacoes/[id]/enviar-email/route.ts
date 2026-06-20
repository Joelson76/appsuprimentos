import { createClient } from '@/lib/supabase/server'
import { enviarCotacaoParaFornecedor } from '@/lib/email-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar perfil e tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Buscar cotação com fornecedor e itens
    const { data: cotacao } = await supabase
      .from('cotacoes')
      .select(
        `
        *,
        fornecedor:fornecedores (id, razao_social, email),
        itens:itens_cotacao (count)
      `
      )
      .eq('id', params.id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (!cotacao) {
      return NextResponse.json({ error: 'Cotação não encontrada' }, { status: 404 })
    }

    if (!cotacao.fornecedor?.email) {
      return NextResponse.json(
        { error: 'Fornecedor sem e-mail cadastrado' },
        { status: 400 }
      )
    }

    // Buscar dados do tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('nome_empresa')
      .eq('id', profile.tenant_id)
      .single()

    // Enviar e-mail
    const resultado = await enviarCotacaoParaFornecedor({
      tenantId: profile.tenant_id,
      emailFornecedor: cotacao.fornecedor.email,
      nomeFornecedor: cotacao.fornecedor.razao_social,
      nomeEmpresa: tenant?.nome_empresa || 'Sua Empresa',
      numeroCotacao: cotacao.numero || `COT-${params.id.slice(0, 8)}`,
      totalItens: cotacao.itens?.[0]?.count || 0,
      prazoResposta: '5 dias úteis',
    })

    // Atualizar status da cotação
    await supabase
      .from('cotacoes')
      .update({
        status: 'ENVIADA',
        enviada_em: new Date().toISOString(),
      })
      .eq('id', params.id)

    return NextResponse.json({
      success: true,
      message: 'E-mail enviado com sucesso',
      messageId: resultado.messageId,
    })
  } catch (error: any) {
    console.error('Erro ao enviar e-mail de cotação:', error)
    return NextResponse.json(
      {
        error: 'Erro ao enviar e-mail',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
