import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

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
        plano,
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        tenant={{
          nome: tenant.nome,
          plano: tenant.plano,
          status: tenant.status,
          trial_fim: tenant.trial_fim,
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
  )
}
