'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface DebugInfo {
  user: {
    id: string
    email: string
    created_at: string
  } | null
  profile: {
    id: string
    nome: string
    email: string
    perfil: string
    tenant_id: string
    tenant_nome?: string
    tenant_cnpj?: string
  } | null
  jwt_claims: {
    tenant_id?: string
    perfil?: string
  }
  produtos_visiveis: number
  todos_tenants: Array<{
    id: string
    nome: string
    cnpj: string
    total_produtos: number
  }>
}

export default function DebugTenantPage() {
  const [info, setInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadDebugInfo = async () => {
    setLoading(true)
    try {
      // 1. Pegar sessão atual
      const { data: { session } } = await supabase.auth.getSession()

      const user = session?.user || null

      // 2. Pegar profile do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          id,
          nome,
          email,
          perfil,
          tenant_id,
          tenant:tenants!profiles_tenant_id_fkey (
            nome,
            cnpj
          )
        `)
        .eq('id', user?.id || '')
        .single()

      // 3. Extrair JWT claims
      const jwt_claims = {
        tenant_id: session?.user?.app_metadata?.tenant_id,
        perfil: session?.user?.app_metadata?.perfil,
      }

      // 4. Contar produtos visíveis pelo RLS (deveria respeitar o tenant_id do JWT)
      const { count: produtosCount } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })

      // 5. Listar TODOS os tenants (usando service_role via API)
      const resAllTenants = await fetch('/api/debug/tenants')
      const allTenants = await resAllTenants.json()

      setInfo({
        user: user ? {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
        } : null,
        profile: profile ? {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          perfil: profile.perfil,
          tenant_id: profile.tenant_id,
          tenant_nome: (profile as any).tenant?.nome,
          tenant_cnpj: (profile as any).tenant?.cnpj,
        } : null,
        jwt_claims,
        produtos_visiveis: produtosCount || 0,
        todos_tenants: allTenants.tenants || [],
      })
    } catch (error) {
      console.error('Erro ao carregar debug info:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDebugInfo()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-8">
            <p className="text-center">Carregando informações de debug...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-red-600">Erro ao carregar informações</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🔍 Debug: Isolamento Multi-Tenant</h1>
        <Button onClick={loadDebugInfo} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar
        </Button>
      </div>

      {/* Usuário Autenticado */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Usuário Autenticado (auth.users)</CardTitle>
        </CardHeader>
        <CardContent>
          {info.user ? (
            <div className="space-y-2 font-mono text-sm">
              <div><strong>ID:</strong> {info.user.id}</div>
              <div><strong>E-mail:</strong> {info.user.email}</div>
              <div><strong>Criado em:</strong> {new Date(info.user.created_at).toLocaleString('pt-BR')}</div>
            </div>
          ) : (
            <p className="text-red-600">Não autenticado</p>
          )}
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Profile (public.profiles)</CardTitle>
        </CardHeader>
        <CardContent>
          {info.profile ? (
            <div className="space-y-2 font-mono text-sm">
              <div><strong>Nome:</strong> {info.profile.nome}</div>
              <div><strong>E-mail:</strong> {info.profile.email}</div>
              <div><strong>Perfil:</strong> {info.profile.perfil}</div>
              <div className="pt-2 border-t">
                <strong>Tenant ID:</strong> <code className="bg-slate-100 px-2 py-1 rounded">{info.profile.tenant_id}</code>
              </div>
              <div><strong>Empresa:</strong> {info.profile.tenant_nome || '❌ Não encontrado'}</div>
              <div><strong>CNPJ:</strong> {info.profile.tenant_cnpj || '❌ Não encontrado'}</div>
            </div>
          ) : (
            <p className="text-red-600">Profile não encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* JWT Claims */}
      <Card className={info.jwt_claims.tenant_id ? 'border-green-500' : 'border-red-500'}>
        <CardHeader>
          <CardTitle>🔑 JWT Claims (app_metadata)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <strong>tenant_id:</strong>{' '}
              {info.jwt_claims.tenant_id ? (
                <code className="bg-green-100 px-2 py-1 rounded text-green-800">{info.jwt_claims.tenant_id}</code>
              ) : (
                <span className="text-red-600 font-bold">❌ NULL (CRÍTICO!)</span>
              )}
            </div>
            <div>
              <strong>perfil:</strong>{' '}
              {info.jwt_claims.perfil ? (
                <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{info.jwt_claims.perfil}</code>
              ) : (
                <span className="text-red-600">❌ NULL</span>
              )}
            </div>
          </div>

          {info.profile?.tenant_id !== info.jwt_claims.tenant_id && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <strong className="text-red-800">⚠️ PROBLEMA DETECTADO:</strong>
              <p className="text-sm text-red-700 mt-1">
                O tenant_id no profile ({info.profile?.tenant_id}) é diferente do JWT ({info.jwt_claims.tenant_id}).
                Faça logout e login novamente para atualizar o JWT.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produtos Visíveis */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Produtos Visíveis pelo RLS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{info.produtos_visiveis} produtos</div>
          <p className="text-sm text-muted-foreground mt-2">
            Estes são os produtos que o RLS permite você ver com base no tenant_id do JWT.
          </p>
        </CardContent>
      </Card>

      {/* Todos os Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>🏢 Todos os Tenants (Admin View)</CardTitle>
        </CardHeader>
        <CardContent>
          {info.todos_tenants.length > 0 ? (
            <div className="space-y-3">
              {info.todos_tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className={`p-3 border rounded ${
                    tenant.id === info.profile?.tenant_id
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="font-semibold">{tenant.nome}</div>
                  <div className="text-sm text-muted-foreground">CNPJ: {tenant.cnpj}</div>
                  <div className="text-sm">
                    <strong>{tenant.total_produtos}</strong> produtos cadastrados
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ID: <code>{tenant.id}</code>
                  </div>
                  {tenant.id === info.profile?.tenant_id && (
                    <div className="text-xs font-semibold text-green-700 mt-2">
                      ✅ ESTE É O SEU TENANT
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum tenant encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="border-blue-500">
        <CardHeader>
          <CardTitle>💡 Como Resolver Problemas de Isolamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. Produtos de outro tenant aparecendo?</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Verifique se o JWT claims tem o tenant_id correto (bloco verde acima)</li>
              <li>Se estiver NULL ou errado, faça <strong>logout e login novamente</strong></li>
              <li>O JWT é gerado no login com base no profile, então re-autenticar resolve</li>
            </ul>
          </div>
          <div>
            <strong>2. Profile com tenant_id errado?</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Execute o script <code>DIAGNOSTIC_TENANT.sql</code> no SQL Editor</li>
              <li>Corrija manualmente: <code>UPDATE profiles SET tenant_id = 'TENANT_CORRETO' WHERE id = 'USER_ID'</code></li>
              <li>Depois faça logout e login para regenerar o JWT</li>
            </ul>
          </div>
          <div>
            <strong>3. Novo cadastro vendo produtos antigos?</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Você criou uma <strong>nova conta</strong> (novo e-mail) ou fez login com conta existente?</li>
              <li>Se fez login com conta antiga, ela está vinculada ao tenant antigo</li>
              <li>Cada CNPJ = 1 tenant diferente, precisa de usuários diferentes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
