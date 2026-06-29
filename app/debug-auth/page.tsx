'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugAuthPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [profileInfo, setProfileInfo] = useState<any>(null)
  const [errors, setErrors] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const debugAuth = async () => {
      const supabase = createClient()

      // 1. Verificar sessão
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        setSessionInfo({
          hasSession: !!session,
          accessToken: session?.access_token ? 'EXISTS' : 'NULL',
          expiresAt: session?.expires_at,
          error: sessionError?.message
        })
        if (sessionError) setErrors(prev => ({ ...prev, session: sessionError.message }))
      } catch (err: any) {
        setErrors(prev => ({ ...prev, session: err.message }))
      }

      // 2. Verificar usuário
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        setUserInfo({
          hasUser: !!user,
          id: user?.id,
          email: user?.email,
          error: userError?.message
        })
        if (userError) setErrors(prev => ({ ...prev, user: userError.message }))

        // 3. Se tem usuário, buscar profile
        if (user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            setProfileInfo({
              hasProfile: !!profile,
              tenantId: profile?.tenant_id,
              perfil: profile?.perfil,
              error: profileError?.message
            })
            if (profileError) setErrors(prev => ({ ...prev, profile: profileError.message }))
          } catch (err: any) {
            setErrors(prev => ({ ...prev, profile: err.message }))
          }
        }
      } catch (err: any) {
        setErrors(prev => ({ ...prev, user: err.message }))
      }

      setLoading(false)
    }

    debugAuth()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando debug info...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🔍 Debug de Autenticação</h1>

      <Card>
        <CardHeader>
          <CardTitle>1. Sessão (Session)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-100 p-4 rounded overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
          {sessionInfo?.hasSession ? (
            <div className="mt-2 text-green-600 font-semibold">✅ Sessão existe</div>
          ) : (
            <div className="mt-2 text-red-600 font-semibold">❌ Sem sessão</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Usuário (User)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-100 p-4 rounded overflow-auto">
            {JSON.stringify(userInfo, null, 2)}
          </pre>
          {userInfo?.hasUser ? (
            <div className="mt-2 text-green-600 font-semibold">✅ Usuário autenticado</div>
          ) : (
            <div className="mt-2 text-red-600 font-semibold">❌ Sem usuário</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-100 p-4 rounded overflow-auto">
            {JSON.stringify(profileInfo, null, 2)}
          </pre>
          {profileInfo?.hasProfile ? (
            <div className="mt-2 text-green-600 font-semibold">✅ Profile encontrado</div>
          ) : (
            <div className="mt-2 text-red-600 font-semibold">❌ Profile não encontrado ou erro</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Erros</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(errors).length > 0 ? (
            <pre className="bg-red-50 p-4 rounded overflow-auto text-red-800">
              {JSON.stringify(errors, null, 2)}
            </pre>
          ) : (
            <div className="text-green-600">✅ Sem erros detectados</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!sessionInfo?.hasSession && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <strong>❌ Problema: Sem sessão</strong>
              <p className="text-sm">Login não está salvando a sessão nos cookies.</p>
            </div>
          )}

          {sessionInfo?.hasSession && !userInfo?.hasUser && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <strong>⚠️ Problema: Sessão existe mas getUser() falha</strong>
              <p className="text-sm">Token existe mas não consegue validar usuário.</p>
            </div>
          )}

          {userInfo?.hasUser && !profileInfo?.hasProfile && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <strong>⚠️ Problema: Usuário existe mas sem profile</strong>
              <p className="text-sm">RLS pode estar bloqueando acesso ao profile.</p>
            </div>
          )}

          {sessionInfo?.hasSession && userInfo?.hasUser && profileInfo?.hasProfile && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <strong>✅ Tudo funcionando!</strong>
              <p className="text-sm">Sessão, usuário e profile carregados com sucesso.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
