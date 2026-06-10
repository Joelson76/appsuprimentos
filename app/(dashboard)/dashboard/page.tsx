import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Users,
  FileText,
  Package,
  TrendingUp,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, tenants(*)')
    .eq('id', user!.id)
    .single()

  const tenant = Array.isArray(profile.tenants)
    ? profile.tenants[0]
    : profile.tenants

  const cards = [
    {
      title: 'Pedidos de Compra',
      value: '0',
      description: 'Nenhum pedido ainda',
      icon: ShoppingCart,
      trend: '+0%',
    },
    {
      title: 'Fornecedores',
      value: '0',
      description: 'Nenhum fornecedor cadastrado',
      icon: Package,
      trend: '+0%',
    },
    {
      title: 'Usuários Ativos',
      value: '1',
      description: 'Você está aqui!',
      icon: Users,
      trend: '+100%',
    },
    {
      title: 'Notas Fiscais',
      value: '0',
      description: 'Nenhuma nota processada',
      icon: FileText,
      trend: '+0%',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TRIAL':
        return <Badge variant="outline">Trial</Badge>
      case 'ATIVO':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case 'BLOQUEADO':
        return <Badge variant="destructive">Bloqueado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Bem-vindo ao SupriFlow, {profile.nome}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui está um resumo da sua conta
        </p>
      </div>

      {tenant.status === 'TRIAL' && tenant.trial_fim && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">
              Período de Avaliação
            </CardTitle>
            <CardDescription className="text-blue-700">
              Você tem até{' '}
              {new Date(tenant.trial_fim).toLocaleDateString('pt-BR')} para
              testar todos os recursos gratuitamente.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">{card.trend}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Empresa:</span>
              <span className="text-sm font-medium">{tenant.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plano:</span>
              <span className="text-sm font-medium">{tenant.plano}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(tenant.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Seu perfil:
              </span>
              <Badge>{profile.perfil}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Conta criada com sucesso</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-300 mt-0.5">○</span>
                <span>Convide membros da equipe</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-300 mt-0.5">○</span>
                <span>Cadastre seus fornecedores</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-300 mt-0.5">○</span>
                <span>Crie sua primeira requisição de compra</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
