'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ForceLogoutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const forceLogout = async () => {
      try {
        // 1. Fazer logout no Supabase
        await supabase.auth.signOut()

        // 2. Limpar localStorage
        localStorage.clear()

        // 3. Limpar sessionStorage
        sessionStorage.clear()

        // 4. Limpar cookies manualmente
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })

        // 5. Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 6. Redirecionar para login
        router.push('/login?logged_out=true')
      } catch (error) {
        console.error('Erro ao fazer logout:', error)
      }
    }

    forceLogout()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        <h1 className="text-2xl font-bold">Limpando sessão...</h1>
        <p className="text-muted-foreground">
          Removendo todas as sessões ativas
        </p>
      </div>
    </div>
  )
}
