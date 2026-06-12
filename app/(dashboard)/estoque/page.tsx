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
import { Plus, AlertTriangle, Eye, Folder } from 'lucide-react'
import type { Produto } from '@/lib/types'
import { NovoProdutoDialog } from '@/components/estoque/novo-produto-dialog'
import { MovimentarEstoqueDialog } from '@/components/estoque/movimentar-estoque-dialog'
import Link from 'next/link'

export default async function EstoquePage() {
  const supabase = await createClient()

  // Buscar produtos
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*, categorias(nome)')
    .eq('ativo', true)
    .order('descricao')

  // Buscar categorias para o select
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome')
    .order('nome')

  const getStatusEstoque = (produto: Produto) => {
    if (!produto.estoque_minimo_alerta) {
      return <Badge variant="secondary">Sem alerta</Badge>
    }

    const percentual =
      (produto.estoque_atual / produto.estoque_minimo_alerta) * 100

    if (percentual <= 50) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Crítico
        </Badge>
      )
    } else if (percentual <= 100) {
      return <Badge className="bg-yellow-100 text-yellow-800">Baixo</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">Normal</Badge>
    }
  }

  const getProgressBarColor = (produto: Produto) => {
    if (!produto.estoque_minimo_alerta) return 'bg-slate-300'

    const percentual =
      (produto.estoque_atual / produto.estoque_minimo_alerta) * 100

    if (percentual <= 50) return 'bg-red-500'
    if (percentual <= 100) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o estoque de produtos
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/estoque/categorias">
            <Button variant="outline">
              <Folder className="mr-2 h-4 w-4" />
              Categorias
            </Button>
          </Link>
          <NovoProdutoDialog categorias={categorias || []} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abaixo do Mínimo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {produtos?.filter(
                (p) =>
                  p.estoque_minimo_alerta &&
                  p.estoque_atual <= p.estoque_minimo_alerta
              ).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estoque Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {produtos?.filter(
                (p) =>
                  p.estoque_minimo_alerta &&
                  p.estoque_atual <= p.estoque_minimo_alerta * 0.5
              ).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estoque Normal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {produtos?.filter(
                (p) =>
                  !p.estoque_minimo_alerta ||
                  p.estoque_atual > p.estoque_minimo_alerta
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>
            {produtos?.length || 0} produto(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Estoque Mínimo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos && produtos.length > 0 ? (
                produtos.map((produto: any) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">
                      {produto.descricao}
                    </TableCell>
                    <TableCell className="font-mono">
                      {produto.codigo || '-'}
                    </TableCell>
                    <TableCell>{produto.categorias?.nome || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold">
                          {produto.estoque_atual} {produto.unidade}
                        </div>
                        {produto.estoque_minimo_alerta && (
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressBarColor(
                                produto
                              )}`}
                              style={{
                                width: `${Math.min(
                                  (produto.estoque_atual /
                                    produto.estoque_minimo_alerta) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {produto.estoque_minimo_alerta
                        ? `${produto.estoque_minimo_alerta} ${produto.unidade}`
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusEstoque(produto)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <MovimentarEstoqueDialog
                          produtoId={produto.id}
                          produtoNome={produto.descricao}
                          estoqueAtual={Number(produto.estoque_atual)}
                          unidade={produto.unidade}
                        />
                        <Link href={`/estoque/${produto.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhum produto cadastrado
                    </div>
                    <div className="mt-4">
                      <NovoProdutoDialog categorias={categorias || []} />
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
