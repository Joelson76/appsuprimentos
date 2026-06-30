import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KPICard } from '@/components/dashboard/kpi-card'
import { AlertasWidget } from '@/components/dashboard/alertas-widget'
import { AprovacoesWidget } from '@/components/dashboard/aprovacoes-widget'
import { GraficoEvolucaoMensal } from '@/components/dashboard/grafico-evolucao-mensal'
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

  // KPIs principais - BUSCAR DIRETO DAS TABELAS (view está com problema)

  // Contar requisições (últimos 30 dias)
  const { count: totalRequisicoes } = await supabase
    .from('requisicoes')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('criado_em', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Buscar TODOS os pedidos do tenant
  const { data: todosPedidos } = await supabase
    .from('pedidos')
    .select('valor_total, criado_em, filial_id')
    .eq('tenant_id', tenantId)

  const totalPedidos = todosPedidos?.length || 0
  const valorTotalPedidos = todosPedidos?.reduce((sum, p) => sum + (Number(p.valor_total) || 0), 0) || 0

  // Buscar pedidos do mês atual usando SQL do PostgreSQL (ignora timezone)
  const { data: resultadoMesAtual } = await supabase
    .from('pedidos')
    .select('valor_total')
    .eq('tenant_id', tenantId)
    .filter('criado_em', 'gte', '2026-06-01')
    .filter('criado_em', 'lt', '2026-07-01')

  const pedidosMesAtual = resultadoMesAtual?.reduce((sum, p) => sum + (Number(p.valor_total) || 0), 0) || 0

  // Contar fornecedores
  const { count: totalFornecedores } = await supabase
    .from('fornecedores')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  const { count: fornecedoresAtivos } = await supabase
    .from('fornecedores')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'ATIVO')

  // Contar requisições pendentes
  const { count: requisicoesPendentes } = await supabase
    .from('requisicoes')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('status', ['AGUARDANDO_APROVACAO', 'EM_ANALISE'])

  const kpis = {
    tenant_id: tenantId,
    total_requisicoes: totalRequisicoes || 0,
    total_pedidos: totalPedidos,
    valor_total_pedidos: valorTotalPedidos,
    pedidos_mes_atual: pedidosMesAtual,
    valor_pedidos_mes: pedidosMesAtual, // NOME CORRETO usado no componente
    total_fornecedores: totalFornecedores || 0,
    fornecedores_ativos: fornecedoresAtivos || 0,
    requisicoes_pendentes: requisicoesPendentes || 0
  }


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

  // Buscar dados do gráfico com JOIN de filiais
  const { data: dadosGrafico } = await supabase
    .rpc('get_breakdown_mensal_filiais', {
      p_tenant_id: tenantId,
      p_meses: 6
    })

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
      <GraficoEvolucaoMensal
        tenantId={tenantId}
        dadosIniciais={dadosGrafico}
      />

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
