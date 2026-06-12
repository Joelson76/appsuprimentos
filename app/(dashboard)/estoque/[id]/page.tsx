import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { MovimentarEstoqueDialog } from '@/components/estoque/movimentar-estoque-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function ProdutoDetalhesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: produto, error } = await supabase
    .from('produtos')
    .select(
      `
      *,
      categoria:categorias (nome)
    `
    )
    .eq('id', params.id)
    .single()

  if (error || !produto) {
    return notFound()
  }

  // Buscar movimentações
  const { data: movimentacoes } = await supabase
    .from('movimentacoes_estoque')
    .select(
      `
      *,
      usuario:profiles (nome)
    `
    )
    .eq('produto_id', params.id)
    .order('criado_em', { ascending: false })
    .limit(50)

  const getStatusEstoque = () => {
    if (!produto.estoque_minimo_alerta) {
      return { label: 'Sem alerta', color: 'bg-slate-100 text-slate-800' }
    }

    const percentual =
      (Number(produto.estoque_atual) / produto.estoque_minimo_alerta) * 100

    if (percentual <= 50) {
      return { label: 'Crítico', color: 'bg-red-100 text-red-800' }
    } else if (percentual <= 100) {
      return { label: 'Baixo', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { label: 'Normal', color: 'bg-green-100 text-green-800' }
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'SAIDA':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'AJUSTE_MAIS':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'AJUSTE_MENOS':
        return <TrendingDown className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getTipoBadge = (tipo: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      ENTRADA: { label: 'Entrada', color: 'bg-green-100 text-green-800' },
      SAIDA: { label: 'Saída', color: 'bg-red-100 text-red-800' },
      AJUSTE_MAIS: {
        label: 'Ajuste +',
        color: 'bg-blue-100 text-blue-800',
      },
      AJUSTE_MENOS: {
        label: 'Ajuste -',
        color: 'bg-orange-100 text-orange-800',
      },
      TRANSFERENCIA: {
        label: 'Transferência',
        color: 'bg-purple-100 text-purple-800',
      },
    }

    const config = configs[tipo] || {
      label: tipo,
      color: 'bg-slate-100 text-slate-800',
    }

    return <Badge className={config.color}>{config.label}</Badge>
  }

  const status = getStatusEstoque()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{produto.descricao}</h1>
            {produto.codigo && (
              <p className="text-muted-foreground mt-1 font-mono">
                SKU: {produto.codigo}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={status.color}>{status.label}</Badge>
          <MovimentarEstoqueDialog
            produtoId={produto.id}
            produtoNome={produto.descricao}
            estoqueAtual={Number(produto.estoque_atual)}
            unidade={produto.unidade}
            trigger={
              <Button>
                <Package className="mr-2 h-4 w-4" />
                Movimentar Estoque
              </Button>
            }
          />
        </div>
      </div>

      {/* Alerta de Estoque Baixo */}
      {produto.estoque_minimo_alerta &&
        Number(produto.estoque_atual) <= produto.estoque_minimo_alerta && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Estoque Abaixo do Mínimo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-800">
                O estoque atual (
                {Number(produto.estoque_atual).toFixed(3)} {produto.unidade})
                está{' '}
                {Number(produto.estoque_atual) <= produto.estoque_minimo_alerta * 0.5
                  ? 'criticamente'
                  : ''}{' '}
                abaixo do mínimo configurado ({produto.estoque_minimo_alerta}{' '}
                {produto.unidade}).
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                💡 Considere realizar uma nova compra deste item.
              </p>
            </CardContent>
          </Card>
        )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Produto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações do Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="font-semibold">{produto.descricao}</p>
            </div>

            {produto.codigo && (
              <div>
                <p className="text-sm text-muted-foreground">Código (SKU)</p>
                <p className="font-mono font-semibold">{produto.codigo}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Unidade</p>
                <p className="font-semibold">{produto.unidade}</p>
              </div>
              {produto.categoria && (
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-semibold">{produto.categoria.nome}</p>
                </div>
              )}
            </div>

            {produto.localizacao && (
              <div>
                <p className="text-sm text-muted-foreground">Localização</p>
                <p className="font-semibold">{produto.localizacao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estoque */}
        <Card>
          <CardHeader>
            <CardTitle>Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Estoque Atual</p>
              <p className="text-4xl font-bold text-green-700">
                {Number(produto.estoque_atual).toFixed(3)} {produto.unidade}
              </p>
            </div>

            {produto.estoque_minimo_alerta && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Estoque Mínimo (Alerta)
                </p>
                <p className="text-xl font-semibold">
                  {produto.estoque_minimo_alerta} {produto.unidade}
                </p>

                {/* Barra de Progresso */}
                <div className="mt-2">
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        Number(produto.estoque_atual) <=
                        produto.estoque_minimo_alerta * 0.5
                          ? 'bg-red-500'
                          : Number(produto.estoque_atual) <=
                              produto.estoque_minimo_alerta
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          (Number(produto.estoque_atual) /
                            produto.estoque_minimo_alerta) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(
                      (Number(produto.estoque_atual) /
                        produto.estoque_minimo_alerta) *
                      100
                    ).toFixed(0)}
                    % do mínimo
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
          <CardDescription>
            {movimentacoes?.length || 0} movimentação(ões) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Saldo Anterior</TableHead>
                <TableHead className="text-right">Saldo Posterior</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentacoes && movimentacoes.length > 0 ? (
                movimentacoes.map((mov: any) => (
                  <TableRow key={mov.id}>
                    <TableCell className="text-sm">
                      {new Date(mov.criado_em).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTipoIcon(mov.tipo)}
                        {getTipoBadge(mov.tipo)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {mov.tipo === 'ENTRADA' || mov.tipo === 'AJUSTE_MAIS'
                        ? '+'
                        : '-'}
                      {Number(mov.quantidade).toFixed(3)} {produto.unidade}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {Number(mov.saldo_anterior).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(mov.saldo_posterior).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {mov.usuario?.nome || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {mov.observacao || '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhuma movimentação registrada
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
