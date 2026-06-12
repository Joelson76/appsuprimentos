import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Target,
  AlertCircle,
} from 'lucide-react'
import { GraficoReceitaMensal } from '@/components/financeiro/grafico-receita-mensal'
import { GraficoPlanos } from '@/components/financeiro/grafico-planos'
import { formatCurrency } from '@/lib/utils'

export default async function FinanceiroPage() {
  const supabase = await createClient()

  // Verificar se é admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('id', user?.id || '')
    .single()

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

  // Buscar todas as assinaturas ativas
  const { data: assinaturas } = await supabase
    .from('assinaturas')
    .select('*, tenant:tenants!assinaturas_tenant_id_fkey(nome, status)')
    .eq('ativa', true)

  // Buscar todas as faturas
  const { data: faturas } = await supabase
    .from('faturas')
    .select('*')
    .order('criado_em', { ascending: false })

  // Buscar faturas dos últimos 12 meses
  const dataLimite = new Date()
  dataLimite.setMonth(dataLimite.getMonth() - 12)

  const { data: faturas12Meses } = await supabase
    .from('faturas')
    .select('*')
    .gte('criado_em', dataLimite.toISOString())

  // Calcular métricas
  const totalAssinaturas = assinaturas?.length || 0

  // MRR (Monthly Recurring Revenue)
  const mrr = assinaturas?.reduce((acc, a) => acc + Number(a.valor_mensal), 0) || 0

  // ARR (Annual Recurring Revenue)
  const arr = mrr * 12

  // Receita total do mês atual
  const mesAtual = new Date().getMonth()
  const anoAtual = new Date().getFullYear()
  const receitaMesAtual =
    faturas?.filter((f) => {
      const data = new Date(f.criado_em)
      return (
        data.getMonth() === mesAtual &&
        data.getFullYear() === anoAtual &&
        f.status === 'PAGO'
      )
    }).reduce((acc, f) => acc + Number(f.valor), 0) || 0

  // Receita total (todas as faturas pagas)
  const receitaTotal =
    faturas?.filter((f) => f.status === 'PAGO').reduce((acc, f) => acc + Number(f.valor), 0) || 0

  // Faturas pendentes
  const faturasAtraso =
    faturas?.filter((f) => f.status === 'VENCIDO' || (f.status === 'PENDENTE' && new Date(f.vencimento) < new Date()))
      .length || 0

  const valorAtraso =
    faturas
      ?.filter((f) => f.status === 'VENCIDO' || (f.status === 'PENDENTE' && new Date(f.vencimento) < new Date()))
      .reduce((acc, f) => acc + Number(f.valor), 0) || 0

  // Taxa de conversão (pagos vs total)
  const taxaConversao = faturas?.length
    ? (faturas.filter((f) => f.status === 'PAGO').length / faturas.length) * 100
    : 0

  // Distribuição por plano
  const distribuicaoPlanos = assinaturas?.reduce((acc: any, a) => {
    acc[a.plano] = (acc[a.plano] || 0) + 1
    return acc
  }, {})

  // Ticket médio
  const ticketMedio = totalAssinaturas > 0 ? mrr / totalAssinaturas : 0

  // Crescimento MRR (comparar com mês anterior)
  const mesPassado = new Date()
  mesPassado.setMonth(mesPassado.getMonth() - 1)
  const receitaMesPassado =
    faturas?.filter((f) => {
      const data = new Date(f.criado_em)
      return (
        data.getMonth() === mesPassado.getMonth() &&
        data.getFullYear() === mesPassado.getFullYear() &&
        f.status === 'PAGO'
      )
    }).reduce((acc, f) => acc + Number(f.valor), 0) || 0

  const crescimentoMRR =
    receitaMesPassado > 0
      ? ((receitaMesAtual - receitaMesPassado) / receitaMesPassado) * 100
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das métricas financeiras do SaaS
        </p>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(mrr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita Recorrente Mensal
            </p>
            {crescimentoMRR !== 0 && (
              <div className="flex items-center gap-1 mt-2">
                {crescimentoMRR > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span
                  className={`text-xs font-medium ${
                    crescimentoMRR > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {crescimentoMRR > 0 ? '+' : ''}
                  {crescimentoMRR.toFixed(1)}% vs mês anterior
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              ARR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(arr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita Recorrente Anual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssinaturas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Assinaturas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(ticketMedio)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Por cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Secundários */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(receitaMesAtual)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(receitaTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {taxaConversao.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Faturas pagas</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(faturasAtraso > 0 || valorAtraso > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Faturas em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-red-700">Quantidade</p>
                <p className="text-2xl font-bold text-red-900">
                  {faturasAtraso}
                </p>
              </div>
              <div>
                <p className="text-sm text-red-700">Valor Total</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(valorAtraso)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <GraficoReceitaMensal faturas={faturas12Meses || []} />
        <GraficoPlanos distribuicao={distribuicaoPlanos || {}} />
      </div>
    </div>
  )
}
