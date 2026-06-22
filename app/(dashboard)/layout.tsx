import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ProviderLimite } from '@/components/limites/provider-limite'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar profile e tenant do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      `
      *,
      tenants (
        id,
        nome,
        status,
        trial_fim,
        logo_url
      )
    `
    )
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const tenant = Array.isArray(profile.tenants)
    ? profile.tenants[0]
    : profile.tenants

  // Busca plano da assinatura (não do tenant)
  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('plano, ativa')
    .eq('tenant_id', tenant.id)
    .single()

  return (
    <ProviderLimite>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          tenant={{
            nome: tenant.nome,
            plano: assinatura?.plano || 'BASICO',
            status: tenant.status,
            trial_fim: tenant.trial_fim,
            logo_url: tenant.logo_url,
          }}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            user={{
              nome: profile.nome,
              email: user.email!,
              perfil: profile.perfil,
            }}
          />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
            {children}
          </main>
        </div>
      </div>
    </ProviderLimite>
  )
}
