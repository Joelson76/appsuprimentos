import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🚨 MIDDLEWARE TOTALMENTE DESABILITADO
// Apenas passa todas as requisições sem fazer NADA

export async function middleware(request: NextRequest) {
  // Literalmente não faz NADA - apenas passa
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
