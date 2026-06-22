'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PageProps {
  params: {
    code: string
  }
}

/**
 * Página de redirecionamento para short links
 * Rota: /c/[code] (ex: /c/a3m5n9k2)
 * Redireciona para: /fornecedor/[token]
 */
export default function ShortLinkPage({ params }: PageProps) {
  const router = useRouter()

  useEffect(() => {
    const redirect = async () => {
      try {
        const supabase = createClient()

        console.log('🔗 Short code recebido:', params.code)

        // Buscar o token original pelo short code
        const { data: shortLink, error } = await supabase
          .from('cotacao_short_links')
          .select('token_original, acessos')
          .eq('short_code', params.code.toLowerCase())
          .single()

        if (error || !shortLink) {
          console.error('❌ Short code não encontrado:', error)
          router.push('/404')
          return
        }

        console.log('✅ Token encontrado:', shortLink.token_original.substring(0, 10) + '...')

        // Atualizar contador de acessos (fire and forget)
        supabase
          .from('cotacao_short_links')
          .update({
            acessos: (shortLink.acessos || 0) + 1,
            ultimo_acesso: new Date().toISOString(),
          })
          .eq('short_code', params.code.toLowerCase())
          .then(() => console.log('📊 Acesso registrado'))

        // Redirecionar para a página completa
        router.push(`/fornecedor/${shortLink.token_original}`)
      } catch (err) {
        console.error('❌ Erro ao processar short link:', err)
        router.push('/404')
      }
    }

    redirect()
  }, [params.code, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecionando...</p>
        <p className="text-xs text-slate-400 mt-2">Código: {params.code}</p>
      </div>
    </div>
  )
}
