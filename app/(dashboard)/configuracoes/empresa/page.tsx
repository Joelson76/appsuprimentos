import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'
import { EditarEmpresaForm } from '@/components/configuracoes/editar-empresa-form'
import { UploadLogoForm } from '@/components/empresa/upload-logo-form'

export default async function EmpresaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, perfil')
    .eq('id', user?.id || '')
    .single()

  // Verificar se é admin
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(profile?.perfil || '')

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Acesso restrito a administradores
        </p>
      </div>
    )
  }

  // Buscar dados do tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', profile?.tenant_id || '')
    .single()

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Empresa não encontrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/configuracoes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Dados da Empresa</h1>
          <p className="text-muted-foreground mt-1">
            Atualize as informações da sua empresa
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações Gerais
            </CardTitle>
            <CardDescription>
              Mantenha os dados da empresa atualizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditarEmpresaForm tenant={tenant} />
          </CardContent>
        </Card>

        {/* Logo da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>Logo da Empresa</CardTitle>
            <CardDescription>
              Personalize a identidade visual do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadLogoForm
              tenantId={tenant.id}
              currentLogoUrl={tenant.logo_url}
              tenantNome={tenant.nome}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
