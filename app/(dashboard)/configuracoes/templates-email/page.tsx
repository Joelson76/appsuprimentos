import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Mail,
  Edit,
  Eye,
  Plus,
  Power,
  PowerOff,
} from 'lucide-react'
import Link from 'next/link'
import { NovoTemplateDialog } from '@/components/email-templates/novo-template-dialog'
import { PreviewTemplateDialog } from '@/components/email-templates/preview-template-dialog'

export default async function TemplatesEmailPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, perfil')
    .eq('id', user?.id || '')
    .single()

  const isAdmin = profile?.perfil === 'SUPER_ADMIN' || profile?.perfil === 'ADMIN'

  // Buscar templates
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', profile?.tenant_id || '')
    .order('tipo')

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      COTACAO_ENVIADA: 'Cotação Enviada',
      COTACAO_RESPONDIDA: 'Cotação Respondida',
      PEDIDO_CRIADO: 'Pedido Criado',
      PEDIDO_APROVADO: 'Pedido Aprovado',
      PEDIDO_CANCELADO: 'Pedido Cancelado',
      ESTOQUE_BAIXO: 'Alerta de Estoque Baixo',
      REQUISICAO_CRIADA: 'Requisição Criada',
      REQUISICAO_APROVADA: 'Requisição Aprovada',
      REQUISICAO_REJEITADA: 'Requisição Rejeitada',
      CONVITE_USUARIO: 'Convite de Usuário',
      BEM_VINDO: 'Boas-vindas',
      FATURA_GERADA: 'Fatura Gerada',
      FATURA_VENCIDA: 'Fatura Vencida',
      ASSINATURA_CANCELADA: 'Assinatura Cancelada',
    }
    return labels[tipo] || tipo
  }

  const getTipoIcon = (tipo: string) => {
    if (tipo.includes('FATURA') || tipo.includes('ASSINATURA')) {
      return '💳'
    }
    if (tipo.includes('PEDIDO')) {
      return '📦'
    }
    if (tipo.includes('COTACAO')) {
      return '💰'
    }
    if (tipo.includes('ESTOQUE')) {
      return '📊'
    }
    if (tipo.includes('REQUISICAO')) {
      return '📋'
    }
    if (tipo.includes('USUARIO') || tipo.includes('BEM_VINDO')) {
      return '👤'
    }
    return '📧'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/configuracoes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Templates de E-mail</h1>
            <p className="text-muted-foreground mt-1">
              Personalize os e-mails enviados automaticamente pelo sistema
            </p>
          </div>
        </div>
        {isAdmin && (
          <NovoTemplateDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            }
          />
        )}
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>
            • <strong>Variáveis dinâmicas:</strong> Use {`{{nome_empresa}}`},{' '}
            {`{{valor_total}}`}, {`{{numero_pedido}}`} etc. nos templates
          </p>
          <p>
            • <strong>Templates ativos:</strong> Apenas um template ativo por
            tipo é usado
          </p>
          <p>
            • <strong>Preview:</strong> Visualize como ficará o email antes de
            ativar
          </p>
          <p>
            • <strong>HTML e Texto:</strong> O sistema envia ambas as versões
            para compatibilidade
          </p>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Templates Cadastrados ({templates?.length || 0})
        </h2>

        {!templates || templates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum template cadastrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro template de e-mail personalizado
              </p>
              {isAdmin && (
                <NovoTemplateDialog
                  trigger={
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Template
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template: any) => (
              <Card key={template.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getTipoIcon(template.tipo)}
                      </span>
                      <div>
                        <CardTitle className="text-lg">
                          {template.nome}
                        </CardTitle>
                        <CardDescription>
                          {getTipoLabel(template.tipo)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={
                        template.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {template.ativo ? (
                        <>
                          <Power className="h-3 w-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <PowerOff className="h-3 w-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.descricao && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.descricao}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Assunto</p>
                      <p className="text-sm font-medium line-clamp-1">
                        {template.assunto}
                      </p>
                    </div>

                    {template.variaveis_disponiveis && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Variáveis disponíveis
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(template.variaveis_disponiveis).map(
                            (variavel: string) => (
                              <Badge
                                key={variavel}
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {`{{${variavel}}}`}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <PreviewTemplateDialog
                      template={template}
                      trigger={
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      }
                    />
                    {isAdmin && (
                      <Link
                        href={`/configuracoes/templates-email/${template.id}/editar`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
