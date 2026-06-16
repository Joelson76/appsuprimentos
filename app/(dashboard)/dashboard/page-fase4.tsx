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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

  // Buscar KPIs
  const { data: kpis } = await supabase
    .from('vw_kpis_dashboard')
    .select('*')
    .single()

  // Produtos abaixo do estoque mínimo
  const { data: produtosBaixoEstoque } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .not('estoque_minimo_alerta', 'is', null)
    .filter('estoque_atual', 'lte', 'estoque_minimo_alerta')

  // Contratos vencendo
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() + 30)

  const { data: contratosVencendo } = await supabase
    .from('contratos')
    .select('*')
    .eq('status', 'VENCENDO')

  // Aprovações pendentes
  const { data: aprovaçõesPendentes } = await supabase
    .from('aprovacoes')
    .select('*')
    .eq('aprovador_id', user!.id)
    .eq('status', 'PENDENTE')

  // Calcular variação percentual
  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return 0
    return ((atual - anterior) / anterior) * 100
  }

  const variacaoGasto = kpis
    ? calcularVariacao(
        Number(kpis.gasto_mes_atual || 0),
        Number(kpis.gasto_mes_anterior || 0)
      )
    : 0

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

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos do Mês
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(kpis?.gasto_mes_atual || 0))}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {variacaoGasto >= 0 ? (
                <TrendingUp className="h-3 w-3 text-red-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-600" />
              )}
              <span
                className={`text-xs ${
                  variacaoGasto >= 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {variacaoGasto >= 0 ? '+' : ''}
                {variacaoGasto.toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Abertos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis?.pos_abertas || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis?.pos_mes_atual || 0} pedidos criados este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estoque Baixo
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {produtosBaixoEstoque?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contratos Vencendo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {contratosVencendo?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aprovações Pendentes */}
      {aprovaçõesPendentes && aprovaçõesPendentes.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">
              ⚠️ Você tem {aprovaçõesPendentes.length} aprovação(ões)
              pendente(s)
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Acesse o menu de aprovações para revisar as solicitações.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Alertas */}
      <div className="grid gap-4 md:grid-cols-2">
        {produtosBaixoEstoque && produtosBaixoEstoque.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Produtos com Estoque Baixo</CardTitle>
              <CardDescription>
                {produtosBaixoEstoque.length} produto(s) abaixo do estoque
                mínimo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {produtosBaixoEstoque.slice(0, 5).map((produto: any) => (
                  <div
                    key={produto.id}
                    className="flex justify-between items-center p-2 bg-orange-50 rounded border border-orange-200"
                  >
                    <span className="text-sm font-medium">
                      {produto.descricao}
                    </span>
                    <Badge variant="outline" className="text-orange-700">
                      {produto.estoque_atual} / {produto.estoque_minimo_alerta}{' '}
                      {produto.unidade}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  )
}
