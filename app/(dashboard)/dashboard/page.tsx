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
  DollarSign,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Buscar métricas de pedidos
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*, fornecedores(razao_social, nome_fantasia)')
    .order('criado_em', { ascending: false })

  const { data: requisicoes } = await supabase
    .from('requisicoes')
    .select('*')
    .order('criado_em', { ascending: false })

  const { data: cotacoes } = await supabase
    .from('cotacoes')
    .select('*')
    .order('criado_em', { ascending: false })

  const { data: fornecedores } = await supabase
    .from('fornecedores')
    .select('*')
    .order('criado_em', { ascending: false })

  // Cálculos
  const totalPedidos = pedidos?.length || 0
  const totalRequisicoes = requisicoes?.length || 0
  const totalCotacoes = cotacoes?.length || 0
  const totalFornecedores = fornecedores?.length || 0

  const valorTotalPedidos = pedidos?.reduce(
    (acc, p) => acc + Number(p.valor_total || 0),
    0
  ) || 0

  const pedidosPendentes =
    pedidos?.filter((p) => p.status === 'PENDENTE').length || 0
  const pedidosEnviados =
    pedidos?.filter((p) => p.status === 'ENVIADO').length || 0
  const pedidosRecebidos =
    pedidos?.filter((p) => p.status === 'RECEBIDO').length || 0

  const requisicoesAguardando =
    requisicoes?.filter((r) => r.status === 'AGUARDANDO_APROVACAO').length || 0

  // Top 5 fornecedores por valor
  const fornecedoresPorValor = pedidos?.reduce((acc: any, pedido) => {
    const fornecedorId = pedido.fornecedor_id
    if (!acc[fornecedorId]) {
      acc[fornecedorId] = {
        id: fornecedorId,
        nome:
          pedido.fornecedores?.nome_fantasia ||
          pedido.fornecedores?.razao_social ||
          'Sem nome',
        total: 0,
        quantidade: 0,
      }
    }
    acc[fornecedorId].total += Number(pedido.valor_total || 0)
    acc[fornecedorId].quantidade += 1
    return acc
  }, {})

  const topFornecedores = Object.values(fornecedoresPorValor || {})
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5)

  // Pedidos recentes
  const pedidosRecentes = pedidos?.slice(0, 5) || []

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total em Pedidos
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(valorTotalPedidos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPedidos} pedido(s) emitido(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPedidos}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <Badge variant="outline" className="text-yellow-600">
                {pedidosPendentes} pendentes
              </Badge>
              <Badge variant="outline" className="text-green-600">
                {pedidosRecebidos} recebidos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requisições</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequisicoes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-yellow-600 font-semibold">
                {requisicoesAguardando}
              </span>{' '}
              aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFornecedores}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCotacoes} cotação(ões)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid com informações */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Fornecedores */}
        <Card>
          <CardHeader>
            <CardTitle>Top Fornecedores</CardTitle>
            <CardDescription>Maiores valores em pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            {topFornecedores.length > 0 ? (
              <div className="space-y-4">
                {topFornecedores.map((fornecedor: any, index) => (
                  <div key={fornecedor.id} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{fornecedor.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {fornecedor.quantidade} pedido(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {formatCurrency(fornecedor.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum pedido emitido ainda
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status dos Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pedidos</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Pendentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{pedidosPendentes}</span>
                  <div className="h-2 w-24 bg-yellow-100 rounded-full">
                    <div
                      className="h-2 bg-yellow-600 rounded-full"
                      style={{
                        width: `${totalPedidos > 0 ? (pedidosPendentes / totalPedidos) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Enviados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{pedidosEnviados}</span>
                  <div className="h-2 w-24 bg-blue-100 rounded-full">
                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{
                        width: `${totalPedidos > 0 ? (pedidosEnviados / totalPedidos) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Recebidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{pedidosRecebidos}</span>
                  <div className="h-2 w-24 bg-green-100 rounded-full">
                    <div
                      className="h-2 bg-green-600 rounded-full"
                      style={{
                        width: `${totalPedidos > 0 ? (pedidosRecebidos / totalPedidos) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {totalPedidos === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pedido emitido ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos Recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pedidos Recentes</CardTitle>
              <CardDescription>Últimos 5 pedidos emitidos</CardDescription>
            </div>
            <Link
              href="/pedidos"
              className="text-sm text-primary hover:underline"
            >
              Ver todos →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pedidosRecentes.length > 0 ? (
            <div className="space-y-4">
              {pedidosRecentes.map((pedido) => {
                const statusColors: Record<string, string> = {
                  PENDENTE: 'bg-yellow-100 text-yellow-800',
                  APROVADO: 'bg-green-100 text-green-800',
                  ENVIADO: 'bg-blue-100 text-blue-800',
                  RECEBIDO: 'bg-green-100 text-green-800',
                  CANCELADO: 'bg-red-100 text-red-800',
                }

                return (
                  <Link
                    key={pedido.id}
                    href={`/pedidos/${pedido.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-mono font-medium">{pedido.numero}</p>
                      <p className="text-sm text-muted-foreground">
                        {pedido.fornecedores?.nome_fantasia ||
                          pedido.fornecedores?.razao_social}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {formatCurrency(pedido.valor_total)}
                      </p>
                      <Badge
                        className={`text-xs ${statusColors[pedido.status] || ''}`}
                      >
                        {pedido.status}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhum pedido emitido ainda
              </p>
              <Link
                href="/requisicoes/nova"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                Criar primeira requisição →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
