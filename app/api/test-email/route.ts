import { NextResponse } from 'next/server'
import {
  sendTrialExpirandoEmail,
  sendPagamentoConfirmadoEmail,
  sendPagamentoVencidoEmail,
  sendAssinaturaAtivadaEmail,
} from '@/lib/email-service-simple'

export async function POST(request: Request) {
  try {
    const { tipo, email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })
    }

    let result

    switch (tipo) {
      case 'trial':
        result = await sendTrialExpirandoEmail(
          email,
          'Empresa Teste',
          3,
          'http://localhost:3000/configuracoes/assinatura'
        )
        break

      case 'pagamento-confirmado':
        result = await sendPagamentoConfirmadoEmail(
          email,
          'Empresa Teste',
          'Profissional',
          79900,
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          'http://localhost:3000/configuracoes/assinatura'
        )
        break

      case 'pagamento-vencido':
        result = await sendPagamentoVencidoEmail(
          email,
          'Empresa Teste',
          79900,
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          'http://localhost:3000/configuracoes/assinatura'
        )
        break

      case 'assinatura-ativada':
        result = await sendAssinaturaAtivadaEmail(
          email,
          'Empresa Teste',
          'Profissional',
          'http://localhost:3000/dashboard'
        )
        break

      default:
        return NextResponse.json(
          { error: 'Tipo inválido. Use: trial, pagamento-confirmado, pagamento-vencido, assinatura-ativada' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    })
  } catch (error: any) {
    console.error('Erro ao testar e-mail:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar e-mail' },
      { status: 500 }
    )
  }
}
