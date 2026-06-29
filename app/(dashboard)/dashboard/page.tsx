import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KPICard } from '@/components/dashboard/kpi-card'
import { AlertasWidget } from '@/components/dashboard/alertas-widget'
import { AprovacoesWidget } from '@/components/dashboard/aprovacoes-widget'
import { BreakdownFiliaisChart } from '@/components/dashboard/breakdown-filiais-chart'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ShoppingCart,
  Users,
  FileText,
  Package,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Se não está autenticado, redirecionar para login
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  // Busca KPIs consolidados
  const { data: kpis, error: kpisError } = await supabase
    .from('vw_dashboard_kpis')
    .select('*')
    .eq('tenant_id', profile?.tenant_id || '')
    .single()

  // Debug
  if (kpisError) {
    console.error('❌ Erro ao buscar KPIs:', kpisError)
  }
  if (!kpis) {
    console.log('⚠️ KPIs retornou null. Profile tenant_id:', profile?.tenant_id)
  }

  // Busca evolução mensal
  const { data: evolucao, error: errorEvolucao } = await supabase
    .from('vw_evolucao_compras_mensal')
    .select('*')
    .eq('tenant_id', profile?.tenant_id || '')
    .order('mes', { ascending: false })
    .limit(12)

  // Debug
  if (errorEvolucao) {
    console.error('❌ Erro ao buscar evolução:', errorEvolucao)
  }
  if (evolucao) {
    console.log('📊 Evolução mensal:', evolucao)
  }

  // Busca top fornecedores
  const { data: topFornecedores } = await supabase
    .from('vw_top_fornecedores')
    .select('*')
    .eq('tenant_id', profile?.tenant_id || '')
    .limit(5)

  // Busca breakdown por filial
  const { data: breakdownFiliais } = await supabase
    .from('vw_breakdown_por_filial')
    .select('*')
    .eq('tenant_id', profile?.tenant_id || '')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do sistema de compras
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total em Pedidos"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis?.valor_total_pedidos || 0)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard
          title="Pedidos do Mês"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis?.valor_pedidos_mes || 0)}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <KPICard
          title="Requisições Pendentes"
          value={kpis?.requisicoes_pendentes || 0}
          icon={<FileText className="h-4 w-4" />}
        />
        <KPICard
          title="Fornecedores Ativos"
          value={kpis?.fornecedores_ativos || 0}
          icon={<Users className="h-4 w-4" />}
          suffix={` / ${kpis?.total_fornecedores || 0}`}
        />
      </div>

      {/* Valor de Pedidos por Mês - Últimos 6 meses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução Mensal de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const dadosValidos = evolucao?.filter((m: any) =>
              m.mes &&
              (m.valor_total > 0 || m.qtd_pedidos > 0)
            ).slice(0, 6).reverse() || []

            return dadosValidos.length > 0 ? (
              <div className="space-y-6">
                {/* Gráfico de Barras Vertical */}
                <div className="flex items-end justify-between gap-4 h-64 pb-2">
                  {dadosValidos.map((mes: any, index: number) => {
                    // Parse da data
                    let mesNome = 'N/A'
                    let mesAbrev = 'N/A'
                    try {
                      if (mes.mes) {
                        const data = new Date(mes.mes)
                        mesNome = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                        mesAbrev = data.toLocaleDateString('pt-BR', { month: 'short' })
                      }
                    } catch (e) {
                      console.error('Erro ao formatar data:', mes.mes, e)
                    }

                    const valorTotal = mes.valor_total || 0
                    const qtdPedidos = mes.qtd_pedidos || 0
                    const maxValor = Math.max(...dadosValidos.map((m: any) => m.valor_total || 0), 1)
                    const alturaPercentual = (valorTotal / maxValor) * 100

                    // Variação
                    const mesAnterior = dadosValidos[index - 1]
                    const variacao = mesAnterior && mesAnterior.valor_total > 0
                      ? ((valorTotal - mesAnterior.valor_total) / mesAnterior.valor_total) * 100
                      : null

                    return (
                      <div key={mes.mes} className="flex-1 flex flex-col items-center gap-2 group">
                        {/* Tooltip com detalhes */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-2 text-center">
                          <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[200px]">
                            <p className="text-xs font-semibold capitalize mb-1">{mesNome}</p>
                            <p className="text-lg font-bold text-primary mb-1">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {qtdPedidos} {qtdPedidos === 1 ? 'pedido' : 'pedidos'}
                            </p>
                            {variacao !== null && (
                              <p className={`text-xs font-medium mt-1 ${
                                variacao > 0 ? 'text-green-600' : variacao < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {variacao > 0 ? '↑' : variacao < 0 ? '↓' : '='} {Math.abs(variacao).toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Barra vertical */}
                        <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                          <div
                            className="w-full max-w-[60px] bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all duration-700 ease-out hover:from-blue-700 hover:to-cyan-500 cursor-pointer shadow-lg"
                            style={{ height: `${alturaPercentual}%`, minHeight: valorTotal > 0 ? '8px' : '0' }}
                          >
                            {/* Valor no topo da barra */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground whitespace-nowrap">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(valorTotal)}
                            </div>
                          </div>
                        </div>

                        {/* Label do mês */}
                        <div className="text-center">
                          <p className="text-xs font-medium capitalize text-muted-foreground">{mesAbrev}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Linha de base */}
                <div className="border-t pt-2">
                  <p className="text-xs text-center text-muted-foreground">Últimos {dadosValidos.length} meses</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum dado de pedidos ainda</p>
                <p className="text-xs mt-1">Comece criando requisições e pedidos</p>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        <AlertasWidget />
        <AprovacoesWidget />
      </div>

      {/* Gráfico e Breakdown por Filial - Só mostra se houver filiais */}
      {breakdownFiliais && breakdownFiliais.length > 0 && (
        <>
          {/* Gráfico de Pedidos por Filial */}
          <BreakdownFiliaisChart data={breakdownFiliais} />

          {/* Breakdown por Filial - Tabela Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Filial / CNPJ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {breakdownFiliais.map((filial: any) => (
                  <div key={filial.filial_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{filial.filial_nome}</p>
                        {filial.is_matriz && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Matriz
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        CNPJ: {filial.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">Requisições</p>
                        <p className="text-sm font-semibold">{filial.total_requisicoes || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pedidos</p>
                        <p className="text-sm font-semibold">{filial.total_pedidos || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor Total</p>
                        <p className="text-sm font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filial.valor_pedidos || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Top Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Top Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          {topFornecedores && topFornecedores.length > 0 ? (
            <div className="space-y-4">
              {topFornecedores.slice(0, 5).map((fornecedor: any, index: number) => (
                <div key={fornecedor.id} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{fornecedor.razao_social}</p>
                    <p className="text-xs text-muted-foreground">
                      {fornecedor.total_pedidos} pedido(s) • Lead time: {fornecedor.lead_time_medio_dias?.toFixed(0) || 0} dias
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fornecedor.valor_total || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Score: {fornecedor.score?.toFixed(1) || 0}/5
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum fornecedor com pedidos
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
