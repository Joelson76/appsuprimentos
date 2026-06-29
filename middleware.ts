import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware vazio - não faz validações
// Auth é validada nas páginas individuais
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Aplicar em todas as rotas (mas não faz nada)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
