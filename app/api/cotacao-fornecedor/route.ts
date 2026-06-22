import { NextResponse } from 'next/server'

/**
 * Rota de redirecionamento alternativa para links de cotação
 * Útil quando o WhatsApp quebra URLs com parâmetros de rota dinâmica
 *
 * Uso: /api/cotacao-fornecedor?token=xxx
 * Redireciona para: /fornecedor/[token]
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Token não fornecido' },
      { status: 400 }
    )
  }

  // Redirecionar para a rota correta
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || ''
  const redirectUrl = `${baseUrl}/fornecedor/${token}`

  return NextResponse.redirect(redirectUrl, 307)
}
