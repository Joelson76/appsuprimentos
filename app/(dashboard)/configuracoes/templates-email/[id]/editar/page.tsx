import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EditarTemplateForm } from '@/components/email-templates/editar-template-form'

export default async function EditarTemplatePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, perfil')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.perfil === 'SUPER_ADMIN' || profile?.perfil === 'ADMIN'

  if (!isAdmin) {
    redirect('/configuracoes/templates-email')
  }

  // Buscar template
  const { data: template, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', params.id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (error || !template) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/configuracoes/templates-email">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Template</h1>
          <p className="text-muted-foreground mt-1">{template.nome}</p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Template</CardTitle>
          <CardDescription>
            Personalize o conteúdo e aparência do e-mail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditarTemplateForm template={template} />
        </CardContent>
      </Card>
    </div>
  )
}
