import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KPICard } from '@/components/dashboard/kpi-card'
import { AlertasWidget } from '@/components/dashboard/alertas-widget'
import { AprovacoesWidget } from '@/components/dashboard/aprovacoes-widget'
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
  DollarSign,
  TrendingUp,
  Building2,
  BarChart3,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  const tenantId = profile?.tenant_id || ''

  // ==================== BUSCAR DADOS ====================

  // KPIs principais
  const { data: kpis, error: kpisError } = await supabase
    .from('vw_dashboard_kpis')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  console.log('📊 KPIs:', { kpis, kpisError, tenantId })

  // Breakdown por filial (tabela, não gráfico ainda)
  const { data: breakdownFiliais } = await supabase
    .from('vw_breakdown_por_filial')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('valor_pedidos', { ascending: false })

  // Top 5 fornecedores
  const { data: topFornecedores } = await supabase
    .from('vw_top_fornecedores')
    .select('*')
    .eq('tenant_id', tenantId)
    .limit(5)

  // Evolução mensal (últimos 6 meses) - agregado global
  // Nota: View pode estar usando 'ordens_compra', verificar depois
  const { data: evolucaoMensal } = await supabase
    .from('vw_evolucao_compras_mensal')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('mes', { ascending: false })
    .limit(6)

  // Dados para gráfico por FILIAL + MÊS (últimos 6 meses)
  const { data: dadosPorFilialMes, error: errorRpc } = await supabase
    .rpc('get_breakdown_mensal_filiais', { p_tenant_id: tenantId })

  // Debug
  if (dadosPorFilialMes && dadosPorFilialMes.length > 0) {
    console.log('🔍 DEBUG - Dados do gráfico:', {
      dadosPorFilialMes,
      primeiroMes: dadosPorFilialMes[0]?.mes,
      tipoDado: typeof dadosPorFilialMes[0]?.mes,
      errorRpc,
      tenantId
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do sistema de compras e suprimentos
        </p>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total em Pedidos"
          value={new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(Number(kpis?.valor_total_pedidos) || 0)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard
          title="Pedidos do Mês"
          value={new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(Number(kpis?.valor_pedidos_mes) || 0)}
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

      {/* Evolução Mensal de Pedidos por FILIAL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução Mensal de Pedidos por Filial
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!dadosPorFilialMes || dadosPorFilialMes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum pedido cadastrado ainda</p>
              <p className="text-xs mt-1">Comece criando requisições e pedidos</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Agrupar por CNPJ/Filial primeiro */}
              {(() => {
                // Map: CNPJ -> Array de {mes, valor}
                const filiaisMap = new Map<string, any[]>()

                dadosPorFilialMes.forEach((item: any) => {
                  const chave = item.cnpj || 'SEM_CNPJ'
                  if (!filiaisMap.has(chave)) {
                    filiaisMap.set(chave, [])
                  }
                  filiaisMap.get(chave)!.push(item)
                })

                // Pegar últimos 6 meses únicos
                const mesesUnicos = Array.from(
                  new Set(dadosPorFilialMes.map((d: any) => d.mes))
                )
                  .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                  .slice(-6)

                // Valor máximo para escala
                const valorMax = Math.max(
                  ...dadosPorFilialMes.map((d: any) => Number(d.valor_pedidos) || 0),
                  1
                )

                // Cores por mês
                const coresMes = [
                  'bg-blue-500',
                  'bg-cyan-500',
                  'bg-purple-500',
                  'bg-emerald-500',
                  'bg-orange-500',
                  'bg-pink-500',
                ]

                return (
                  <div className="space-y-8">
                    {/* Gráfico de barras agrupadas */}
                    <div className="flex items-end justify-between gap-6 h-80 pb-4">
                      {Array.from(filiaisMap.entries()).map(([cnpj, dadosFilial]) => {
                        const info = dadosFilial[0]
                        const nomeFilial = info?.filial_nome || 'Sem Nome'
                        const isMatriz = info?.is_matriz || false

                        return (
                          <div key={cnpj} className="flex-1 flex flex-col items-center gap-3">
                            {/* Barras (uma por mês) */}
                            <div className="w-full flex items-end justify-center gap-1 h-full">
                              {mesesUnicos.map((mes, idx) => {
                                const dadoMes = dadosFilial.find((d: any) => d.mes === mes)
                                const valor = Number(dadoMes?.valor_pedidos) || 0
                                const altura = (valor / valorMax) * 100

                                // Formatar mês de forma simples
                                let mesAbrev = 'N/A'
                                try {
                                  const [year, month] = mes.toString().substring(0, 7).split('-')
                                  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
                                  mesAbrev = meses[parseInt(month) - 1] || 'N/A'
                                } catch (e) {
                                  console.error('Erro ao formatar mês:', mes, e)
                                }

                                return (
                                  <div
                                    key={idx}
                                    className="flex-1 group relative flex items-end"
                                    style={{ maxWidth: '48px' }}
                                  >
                                    <div className="relative w-full h-full">
                                      {/* Valor fixo sempre visível */}
                                      {valor > 0 && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground whitespace-nowrap">
                                          {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                            maximumFractionDigits: 0
                                          }).format(valor)}
                                        </div>
                                      )}
                                      {/* Barra */}
                                      <div
                                        className={`w-full ${coresMes[idx % coresMes.length]} rounded-t transition-all duration-300 hover:opacity-80 border border-gray-300`}
                                        style={{
                                          height: `${altura}%`,
                                          minHeight: valor > 0 ? '20px' : '0'
                                        }}
                                        title={`${nomeFilial} - ${mesAbrev}: ${new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL'
                                        }).format(valor)}`}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Label da Filial */}
                            <div className="text-center p-3 bg-accent/30 rounded-lg w-full">
                              <div className="flex items-center justify-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-bold truncate">
                                  {nomeFilial}
                                </p>
                                {isMatriz && (
                                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-semibold">
                                    M
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Legenda de Meses */}
                    <div className="flex items-center justify-center gap-4 flex-wrap border-t pt-4">
                      {mesesUnicos.map((mes, idx) => {
                        let mesAbrev = 'N/A'
                        try {
                          const [year, month] = mes.toString().substring(0, 7).split('-')
                          const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
                          mesAbrev = `${meses[parseInt(month) - 1]} ${year.substring(2)}`
                        } catch (e) {
                          console.error('Erro ao formatar mês legenda:', mes, e)
                        }
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${coresMes[idx % coresMes.length]}`} />
                            <span className="text-xs font-medium capitalize">{mesAbrev}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas e Aprovações */}
      <div className="grid gap-6 md:grid-cols-2">
        <AlertasWidget tenantId={tenantId} />
        <AprovacoesWidget tenantId={tenantId} />
      </div>

      {/* Top 5 Fornecedores */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top 5 Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!topFornecedores || topFornecedores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum fornecedor com pedidos
              </p>
            ) : (
              <div className="space-y-3">
                {topFornecedores.map((forn: any, idx: number) => (
                  <div
                    key={forn.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{forn.razao_social}</p>
                      <p className="text-xs text-muted-foreground">
                        {forn.total_pedidos} pedidos • Score: {forn.score?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0
                        }).format(Number(forn.valor_total) || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
