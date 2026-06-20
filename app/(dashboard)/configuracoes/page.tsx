import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Settings,
  CreditCard,
  Users,
  Building2,
  Bell,
  Lock,
  TrendingUp,
  Mail,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react'
import Link from 'next/link'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil, tenant_id')
    .eq('id', user?.id || '')
    .single()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', profile?.tenant_id || '')
    .single()

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('plano, ativa')
    .eq('tenant_id', profile?.tenant_id || '')
    .single()

  const isAdmin = profile?.perfil === 'SUPER_ADMIN' || profile?.perfil === 'ADMIN'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as configurações da sua conta e empresa
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Empresa</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/configuracoes/empresa">
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da Empresa
                </CardTitle>
                <CardDescription>
                  Nome, CNPJ, endereço e informações gerais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium">{tenant?.nome || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CNPJ</p>
                    <p className="font-medium font-mono">{tenant?.cnpj || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{tenant?.status || '-'}</p>
                  </div>
                </div>
                {isAdmin && (
                  <Button variant="outline" className="w-full mt-4">
                    Editar Dados
                  </Button>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/configuracoes/filiais">
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Filiais
                </CardTitle>
                <CardDescription>
                  Gerencie matriz e filiais (multi-CNPJ)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Cadastre e controle operações de múltiplas unidades
                </p>
                <Button variant="outline" className="w-full">
                  Ver Filiais
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/configuracoes/assinatura">
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Assinatura e Pagamento
                </CardTitle>
                <CardDescription>
                  Plano atual, próximo vencimento e faturas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Plano Atual</p>
                    <p className="font-medium text-lg text-primary">
                      {assinatura?.plano || 'BASICO'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {assinatura?.ativa ? 'ATIVA' : 'INATIVA'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Planos e Cobrança</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/configuracoes/planos">
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Comparar Planos
                </CardTitle>
                <CardDescription>
                  Veja todos os planos disponíveis e faça upgrade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Básico, Profissional ou Enterprise - escolha o melhor para sua empresa
                </p>
                <Button variant="default" className="w-full">
                  Ver Planos
                </Button>
              </CardContent>
            </Card>
          </Link>

          {isAdmin && (
            <>
              <Link href="/admin/cobrancas">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Gestão de Cobranças
                    </CardTitle>
                    <CardDescription>
                      Painel administrativo de faturas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Visualize todas as faturas
                    </p>
                    <Button variant="outline" className="w-full">
                      Ver Faturas
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/financeiro">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <BarChart3 className="h-5 w-5" />
                      Dashboard Financeiro
                    </CardTitle>
                    <CardDescription>
                      MRR, ARR e métricas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Análise financeira completa
                    </p>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Ver Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Usuários e Segurança</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/usuarios">
              <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gerenciar Usuários
                  </CardTitle>
                  <CardDescription>
                    Adicionar, editar ou remover usuários
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/configuracoes/seguranca">
              <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Segurança
                  </CardTitle>
                  <CardDescription>
                    Senha, autenticação e logs de acesso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Notificações</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/configuracoes/notificacoes">
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferências de Notificação
                </CardTitle>
                <CardDescription>
                  Configure alertas por e-mail e push notification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Configurar
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:bg-slate-50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Templates de E-mail
              </CardTitle>
              <CardDescription>
                Personalize e-mails enviados pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Em breve
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Minha Conta</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>
              Seu perfil, senha e preferências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm mb-4">
              <div>
                <p className="text-muted-foreground">E-mail</p>
                <p className="font-medium">{user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Perfil</p>
                <p className="font-medium">{profile?.perfil || '-'}</p>
              </div>
            </div>
            <Button variant="outline" disabled>
              Editar Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
