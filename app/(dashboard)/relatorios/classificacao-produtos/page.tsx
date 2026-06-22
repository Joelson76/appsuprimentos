import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'

const classificacaoLabels: Record<string, string> = {
  COMPRAS_DIRETAS: 'Compras Diretas',
  COMPRAS_INDIRETAS: 'Compras Indiretas',
  ATIVOS_IMOBILIZADOS: 'Ativos Imobilizados',
  USO_IMEDIATO: 'Uso Imediato'
}

const classificacaoColors: Record<string, string> = {
  COMPRAS_DIRETAS: 'bg-blue-100 text-blue-800',
  COMPRAS_INDIRETAS: 'bg-purple-100 text-purple-800',
  ATIVOS_IMOBILIZADOS: 'bg-orange-100 text-orange-800',
  USO_IMEDIATO: 'bg-teal-100 text-teal-800'
}

const classificacaoIcons: Record<string, string> = {
  COMPRAS_DIRETAS: '🏭',
  COMPRAS_INDIRETAS: '🔧',
  ATIVOS_IMOBILIZADOS: '🏗️',
  USO_IMEDIATO: '⚡'
}

export default async function RelatorioClassificacaoProdutosPage() {
  const supabase = await createClient()

  // Buscar estatísticas por classificação
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)

  // Agrupar por classificação
  const estatisticas = produtos?.reduce((acc: any, produto: any) => {
    const classif = produto.classificacao || 'NAO_CLASSIFICADO'

    if (!acc[classif]) {
      acc[classif] = {
        total: 0,
        com_estoque: 0,
        total_estoque: 0,
        valor_total: 0,
        custo_medio: 0
      }
    }

    acc[classif].total++
    if (produto.estoque_atual > 0) {
      acc[classif].com_estoque++
      acc[classif].total_estoque += Number(produto.estoque_atual)
    }

    if (produto.custo_medio && produto.estoque_atual > 0) {
      acc[classif].valor_total += Number(produto.custo_medio) * Number(produto.estoque_atual)
    }

    return acc
  }, {})

  // Calcular totais gerais
  const totais = {
    produtos: produtos?.length || 0,
    com_estoque: produtos?.filter(p => p.estoque_atual > 0).length || 0,
    valor_total: produtos?.reduce((acc, p) => {
      if (p.custo_medio && p.estoque_atual > 0) {
        return acc + (Number(p.custo_medio) * Number(p.estoque_atual))
      }
      return acc
    }, 0) || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/relatorios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Produtos por Classificação</h1>
          <p className="text-muted-foreground mt-1">
            Análise de produtos segmentados por tipo de compra
          </p>
        </div>
      </div>

      {/* Cards de Totais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais.produtos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totais.com_estoque} com estoque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totais.valor_total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Classificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(estatisticas || {}).filter(k => k !== 'NAO_CLASSIFICADO').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              tipos diferentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela por Classificação */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Classificação</CardTitle>
          <CardDescription>
            Estatísticas agrupadas por tipo de compra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classificação</TableHead>
                <TableHead className="text-right">Total Produtos</TableHead>
                <TableHead className="text-right">Com Estoque</TableHead>
                <TableHead className="text-right">Qtd. Total</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estatisticas && Object.entries(estatisticas)
                .filter(([key]) => key !== 'NAO_CLASSIFICADO')
                .sort(([, a]: any, [, b]: any) => b.valor_total - a.valor_total)
                .map(([classificacao, stats]: any) => {
                  const percentual = totais.valor_total > 0
                    ? (stats.valor_total / totais.valor_total) * 100
                    : 0

                  return (
                    <TableRow key={classificacao}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{classificacaoIcons[classificacao]}</span>
                          <Badge className={classificacaoColors[classificacao]}>
                            {classificacaoLabels[classificacao]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {stats.total}
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.com_estoque}
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.total_estoque.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(stats.valor_total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {percentual.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}

              {/* Produtos não classificados */}
              {estatisticas?.NAO_CLASSIFICADO && (
                <TableRow className="bg-slate-50">
                  <TableCell>
                    <Badge variant="outline">Não Classificado</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {estatisticas.NAO_CLASSIFICADO.total}
                  </TableCell>
                  <TableCell className="text-right">
                    {estatisticas.NAO_CLASSIFICADO.com_estoque}
                  </TableCell>
                  <TableCell className="text-right">
                    {estatisticas.NAO_CLASSIFICADO.total_estoque.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(estatisticas.NAO_CLASSIFICADO.valor_total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-muted-foreground">-</span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cards Detalhados por Classificação */}
      <div className="grid gap-4 md:grid-cols-2">
        {estatisticas && Object.entries(estatisticas)
          .filter(([key]) => key !== 'NAO_CLASSIFICADO')
          .map(([classificacao, stats]: any) => (
            <Card key={classificacao}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{classificacaoIcons[classificacao]}</span>
                    <div>
                      <CardTitle className="text-lg">
                        {classificacaoLabels[classificacao]}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {stats.total} produtos cadastrados
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Produtos com Estoque:</span>
                    <span className="font-semibold">{stats.com_estoque}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quantidade Total:</span>
                    <span className="font-semibold">{stats.total_estoque.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor Total:</span>
                    <span className="font-semibold text-lg">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(stats.valor_total)}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <Link href={`/estoque?classificacao=${classificacao}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Ver Produtos
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
