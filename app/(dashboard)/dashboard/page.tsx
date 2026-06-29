import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KPICard } from '@/components/dashboard/kpi-card'
import { AlertasWidget } from '@/components/dashboard/alertas-widget'
import { AprovacoesWidget } from '@/components/dashboard/aprovacoes-widget'
import { BreakdownFiliaisChart } from '@/components/dashboard/breakdown-filiais-chart'
import { BreakdownMensalFiliaisChart } from '@/components/dashboard/breakdown-mensal-filiais-chart'
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

  // Buscar todas as filiais do tenant
  const { data: filiais } = await supabase
    .from('filiais')
    .select('id, nome, cnpj, is_matriz')
    .eq('tenant_id', profile?.tenant_id || '')
    .eq('ativa', true)
    .order('is_matriz', { ascending: false })

  // Buscar pedidos direto e agrupar
  const { data: pedidosRaw } = await supabase
    .from('ordens_compra')
    .select('criado_em, valor_total, filial_id')
    .eq('tenant_id', profile?.tenant_id || '')
    .not('status', 'in', '("CANCELADA","RASCUNHO")')
    .gte('criado_em', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

  // Agrupar manualmente por filial + mês
  let evolucaoPorFilial: any[] = []

  if (pedidosRaw && filiais) {
    const grouped = new Map<string, any>()

    pedidosRaw.forEach(pedido => {
      const mes = new Date(pedido.criado_em).toISOString().substring(0, 7) // YYYY-MM
      const filialId = pedido.filial_id || 'SEM_FILIAL'
      const key = `${mes}-${filialId}`

      if (!grouped.has(key)) {
        const filial = filiais.find(f => f.id === filialId)
        grouped.set(key, {
          mes: mes + '-01',
          filial_id: filialId,
          filial_nome: filial?.nome || 'Sem Filial',
          cnpj: filial?.cnpj || null,
          is_matriz: filial?.is_matriz || false,
          qtd_pedidos: 0,
          valor_total: 0
        })
      }

      const item = grouped.get(key)!
      item.qtd_pedidos++
      item.valor_total += pedido.valor_total || 0
    })

    evolucaoPorFilial = Array.from(grouped.values())
  }

  // Debug
  if (errorEvolucao) console.error('❌ Erro evolução:', errorEvolucao)

  console.log('📊 Dashboard:', {
    evolucao: evolucao?.length || 0,
    evolucaoPorFilial: evolucaoPorFilial?.length || 0,
    filiais: filiais?.length || 0,
    pedidosRaw: pedidosRaw?.length || 0
  })

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

      {/* Gráfico Mensal por Filial/CNPJ - NOVO FORMATO */}
      {evolucaoPorFilial && evolucaoPorFilial.length > 0 && (
        <BreakdownMensalFiliaisChart data={evolucaoPorFilial} />
      )}

      {/* Valor de Pedidos por Mês - Últimos 6 meses (ANTIGO - manter como fallback) */}
      <Card className={evolucaoPorFilial && evolucaoPorFilial.length > 0 ? 'hidden' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução Mensal de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // Verificar se tem dados
            const temDadosAgregados = evolucao && evolucao.length > 0
            if (!temDadosAgregados) {
              return (
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum dado de pedidos ainda</p>
                  <p className="text-xs mt-1">Comece criando requisições e pedidos</p>
                </div>
              )
            }

            // Preparar dados agrupados por FILIAL
            const temDadosPorFilial = evolucaoPorFilial && evolucaoPorFilial.length > 0

            if (!temDadosPorFilial) {
              // Se não tem dados por filial, mostrar agregado simples
              const dadosValidos = evolucao.filter((m: any) =>
                m.mes && (m.valor_total > 0 || m.qtd_pedidos > 0)
              ).slice(0, 6).reverse()

              const maxValor = Math.max(...dadosValidos.map((m: any) => m.valor_total || 0), 1)

              // Renderizar gráfico simples (sem filiais) + DEBUG
              return (
                <div className="space-y-6">
                  {/* ALERTA: Sem dados por filial */}
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
                    <p className="text-sm font-bold text-yellow-900 mb-2">⚠️ CNPJ Não Disponível</p>
                    <p className="text-xs text-yellow-800 mb-3">
                      Os pedidos não estão associados a filiais com CNPJ cadastrado.
                    </p>
                    <div className="bg-white rounded p-3 font-mono text-xs space-y-1">
                      <p><strong>Filiais cadastradas:</strong> {filiais?.length || 0}</p>
                      <p><strong>Pedidos brutos:</strong> {pedidosRaw?.length || 0}</p>
                      <p><strong>Evolução por filial:</strong> {evolucaoPorFilial?.length || 0}</p>
                      <p className="text-red-600 font-bold mt-2">
                        {evolucaoPorFilial?.length === 0 && '❌ Pedidos sem filial_id ou filiais sem CNPJ!'}
                      </p>
                    </div>
                    <p className="text-xs text-yellow-800 mt-3">
                      <strong>Solução:</strong> Associe os pedidos às filiais ou cadastre o CNPJ das filiais.
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-4 h-64 pb-2">
                    {dadosValidos.map((mes: any, index: number) => {
                      const valorTotal = mes.valor_total || 0
                      const alturaPercentual = (valorTotal / maxValor) * 100
                      let mesAbrev = 'N/A'
                      try {
                        mesAbrev = new Date(mes.mes).toLocaleDateString('pt-BR', { month: 'short' })
                      } catch (e) {}

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                            <div
                              className="w-full max-w-[60px] bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all duration-700 cursor-pointer shadow-lg"
                              style={{ height: `${alturaPercentual}%`, minHeight: valorTotal > 0 ? '8px' : '0' }}
                            >
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground whitespace-nowrap">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(valorTotal)}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs font-medium capitalize text-muted-foreground">{mesAbrev}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-xs text-center text-muted-foreground">Últimos {dadosValidos.length} meses</p>
                  </div>
                </div>
              )
            }

            // Agrupar por FILIAL primeiro
            const filiaisPorCnpj = new Map<string, any[]>()
            evolucaoPorFilial.forEach((item: any) => {
              const cnpj = item.cnpj || 'SEM_CNPJ'
              if (!filiaisPorCnpj.has(cnpj)) {
                filiaisPorCnpj.set(cnpj, [])
              }
              filiaisPorCnpj.get(cnpj)?.push(item)
            })

            // Pegar últimos 6 meses únicos
            const mesesUnicos = [...new Set(evolucaoPorFilial.map((e: any) => e.mes))]
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .slice(0, 6)
              .reverse()

            // Cores para meses
            const coresMeses = [
              'from-blue-600 to-blue-400',
              'from-cyan-600 to-cyan-400',
              'from-purple-600 to-purple-400',
              'from-emerald-600 to-emerald-400',
              'from-orange-600 to-orange-400',
              'from-pink-600 to-pink-400',
            ]

            // Calcular max valor global
            const maxValor = Math.max(
              ...Array.from(filiaisPorCnpj.values()).flat().map((e: any) => e.valor_total || 0),
              1
            )

            // Renderizar: Valores mensais em cima, CNPJs embaixo
            return (
              <div className="space-y-6">
                {/* Gráfico agrupado por FILIAL - Valores mensais */}
                <div className="flex items-end justify-between gap-6 h-64 pb-2">
                  {Array.from(filiaisPorCnpj.entries()).map(([cnpj, dadosFilial], filialIdx) => {
                    const filialInfo = dadosFilial[0]
                    const filialNome = filialInfo?.filial_nome || cnpj

                    return (
                      <div key={cnpj} className="flex-1 flex flex-col items-center gap-2">
                        {/* Grupo de barras para esta filial (uma barra por mês) */}
                        <div className="w-full flex items-end justify-center gap-1" style={{ height: '100%' }}>
                          {mesesUnicos.map((mes, mesIdx) => {
                            const dadoMes = dadosFilial.find((d: any) => d.mes === mes)
                            const valor = dadoMes?.valor_total || 0
                            const altura = (valor / maxValor) * 100

                            let mesAbrev = 'N/A'
                            try {
                              mesAbrev = new Date(mes).toLocaleDateString('pt-BR', { month: 'short' })
                            } catch (e) {}

                            return (
                              <div
                                key={mesIdx}
                                className="flex-1 group relative"
                                style={{ maxWidth: '32px' }}
                              >
                                {/* Barra */}
                                <div
                                  className={`w-full bg-gradient-to-t ${coresMeses[mesIdx % coresMeses.length]} rounded-t-lg transition-all duration-700 cursor-pointer shadow-sm hover:opacity-80`}
                                  style={{ height: `${altura}%`, minHeight: valor > 0 ? '8px' : '0' }}
                                  title={`${filialNome} - ${mesAbrev}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}`}
                                >
                                  {/* Valor no topo */}
                                  {valor > 0 && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                      {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                        minimumFractionDigits: 0
                                      }).format(valor)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Label completo na base: CNPJ → Meses → Valores */}
                        <div className="text-center space-y-3 mt-3 p-4 border-t-2 border-primary/20 bg-accent/30 rounded-b-lg">
                          {/* Nome + Badge */}
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-lg font-bold text-foreground">
                              {filialNome}
                            </p>
                            {filialInfo?.is_matriz && (
                              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-bold shadow-sm">
                                MATRIZ
                              </span>
                            )}
                          </div>

                          {/* CNPJ - SEMPRE MOSTRA (mesmo se vazio) */}
                          <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 px-4 py-3 rounded-lg shadow-sm">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">CNPJ</p>
                            <p className="text-base font-black text-blue-900 dark:text-blue-100 font-mono tracking-wide">
                              {filialInfo?.cnpj
                                ? filialInfo.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
                                : '❌ CNPJ NÃO CADASTRADO'}
                            </p>
                            {!filialInfo?.cnpj && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Cadastre o CNPJ desta filial
                              </p>
                            )}
                          </div>

                          {/* Meses */}
                          <div className="flex justify-center gap-1 text-xs text-muted-foreground font-medium">
                            {mesesUnicos.map((mes, idx) => {
                              let mesAbrev = 'N/A'
                              try {
                                mesAbrev = new Date(mes).toLocaleDateString('pt-BR', { month: 'short' })
                              } catch (e) {}
                              return <span key={idx} className="capitalize w-12 text-center">{mesAbrev}</span>
                            })}
                          </div>

                          {/* Valores por mês */}
                          <div className="flex justify-center gap-1 text-xs font-bold text-primary">
                            {mesesUnicos.map((mes, idx) => {
                              const dadoMes = dadosFilial.find((d: any) => d.mes === mes)
                              const valor = dadoMes?.valor_total || 0
                              return (
                                <span key={idx} className="w-12 text-center">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  }).format(valor)}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Resumo por CNPJ - EMBAIXO DO GRÁFICO */}
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-semibold text-foreground mb-3">Totais por CNPJ/Filial:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {Array.from(filiaisPorCnpj.entries()).map(([cnpj, dadosFilial]) => {
                      const filialInfo = dadosFilial[0]
                      const valorTotal = dadosFilial.reduce((sum, d) => sum + (d.valor_total || 0), 0)
                      const qtdTotal = dadosFilial.reduce((sum, d) => sum + (d.qtd_pedidos || 0), 0)

                      return (
                        <div key={`resumo-${cnpj}`} className="p-4 border rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-bold text-foreground truncate flex-1">
                              {filialInfo?.filial_nome || cnpj}
                            </p>
                            {filialInfo?.is_matriz && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                                Matriz
                              </span>
                            )}
                          </div>
                          {filialInfo?.cnpj && (
                            <p className="text-xs text-muted-foreground font-mono mb-3">
                              CNPJ: {filialInfo.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                            </p>
                          )}
                          <div className="space-y-1">
                            <p className="text-2xl font-bold text-primary">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {qtdTotal} {qtdTotal === 1 ? 'pedido' : 'pedidos'} • Últimos {mesesUnicos.length} meses
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Legenda de meses */}
                <div className="border-t pt-3 mt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Legenda de Cores (Meses):</p>
                  <div className="flex flex-wrap gap-3">
                    {mesesUnicos.map((mes, idx) => {
                      let mesNome = 'N/A'
                      try {
                        mesNome = new Date(mes).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                      } catch (e) {}

                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded bg-gradient-to-t ${coresMeses[idx % coresMeses.length]}`} />
                          <span className="text-xs text-muted-foreground capitalize">{mesNome}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
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
