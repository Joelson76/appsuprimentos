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
  Edit,
  Barcode,
  DollarSign,
  Ruler,
  FileText,
  Building2,
  Calendar,
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
      categoria:categorias (nome),
      fornecedor:fornecedores (id, razao_social, cnpj)
    `
    )
    .eq('id', params.id)
    .single()

  if (error || !produto) {
    return notFound()
  }

  console.log('Produto completo:', produto)

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
          <Link href={`/estoque/produtos/${produto.id}/editar`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
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
            <CardDescription>
              Cadastrado em {formatDate(produto.criado_em)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="text-lg font-semibold">{produto.descricao}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Código (SKU)</p>
                <p className="font-mono font-semibold">
                  {produto.codigo || <span className="text-muted-foreground">-</span>}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Barcode className="h-3 w-3" />
                  Código de Barras
                </p>
                <p className="font-mono font-semibold">
                  {produto.codigo_barras || <span className="text-muted-foreground">-</span>}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Unidade</p>
                <p className="font-semibold">{produto.unidade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <p className="font-semibold">
                  {produto.categoria?.nome || <span className="text-muted-foreground">-</span>}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Marca</p>
                <p className="font-semibold">
                  {produto.marca || <span className="text-muted-foreground">-</span>}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-semibold">
                  {produto.modelo || <span className="text-muted-foreground">-</span>}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">NCM</p>
                <p className="font-mono font-semibold">
                  {produto.ncm || <span className="text-muted-foreground">-</span>}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Localização
                </p>
                <p className="font-semibold">
                  {produto.localizacao || <span className="text-muted-foreground">-</span>}
                </p>
              </div>
            </div>

            {/* Controles - só mostra se algum estiver ativo */}
            {(produto.lote_obrigatorio || produto.validade_obrigatoria) && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Controles Ativos
                </p>
                <div className="flex flex-wrap gap-2">
                  {produto.lote_obrigatorio && (
                    <Badge variant="outline" className="bg-blue-50">
                      📦 Controle de Lote
                    </Badge>
                  )}
                  {produto.validade_obrigatoria && (
                    <Badge variant="outline" className="bg-orange-50">
                      📅 Controle de Validade
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estoque */}
        <Card>
          <CardHeader>
            <CardTitle>Controle de Estoque</CardTitle>
            <CardDescription>
              Última atualização em {formatDate(produto.atualizado_em)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Estoque Atual</p>
              <p className="text-4xl font-bold text-green-700">
                {Number(produto.estoque_atual).toFixed(3)} {produto.unidade}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Estoque Mínimo</p>
                <p className="text-lg font-semibold text-yellow-600">
                  {produto.estoque_minimo_alerta ? (
                    `${produto.estoque_minimo_alerta} ${produto.unidade}`
                  ) : (
                    <span className="text-muted-foreground">Não configurado</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Máximo</p>
                <p className="text-lg font-semibold text-blue-600">
                  {produto.estoque_maximo ? (
                    `${Number(produto.estoque_maximo).toFixed(3)} ${produto.unidade}`
                  ) : (
                    <span className="text-muted-foreground">Não configurado</span>
                  )}
                </p>
              </div>
            </div>

            {produto.estoque_minimo_alerta && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Nível de Estoque
                </p>
                {/* Barra de Progresso */}
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
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
            )}

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">Status do Estoque</p>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações Financeiras e Dimensões */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Informações Financeiras
            </CardTitle>
            <CardDescription>
              Valores de custo e venda do produto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Custo Médio</p>
              <p className="text-2xl font-bold text-blue-700">
                {produto.custo_medio ? (
                  `R$ ${Number(produto.custo_medio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                ) : (
                  <span className="text-muted-foreground text-base">Não informado</span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Última Compra</p>
                <p className="text-lg font-semibold">
                  {produto.custo_ultima_compra ? (
                    `R$ ${Number(produto.custo_ultima_compra).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preço de Venda</p>
                <p className="text-lg font-semibold text-green-700">
                  {produto.preco_venda ? (
                    `R$ ${Number(produto.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </p>
              </div>
            </div>

            {produto.custo_medio && produto.preco_venda && (
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {(((Number(produto.preco_venda) - Number(produto.custo_medio)) / Number(produto.custo_medio)) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Lucro Unitário</p>
                    <p className="text-lg font-semibold text-purple-700">
                      R$ {(Number(produto.preco_venda) - Number(produto.custo_medio)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {produto.custo_medio && produto.estoque_atual && (
              <div className="pt-3 border-t bg-slate-50 -mx-6 px-6 py-3 -mb-6">
                <p className="text-sm text-muted-foreground">Valor Total em Estoque</p>
                <p className="text-xl font-bold text-slate-700">
                  R$ {(Number(produto.custo_medio) * Number(produto.estoque_atual)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Dimensões e Peso
            </CardTitle>
            <CardDescription>
              Informações físicas do produto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Peso:</p>
              <p className="font-semibold">
                {produto.peso ? (
                  `${Number(produto.peso).toFixed(3)} kg`
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
            </div>

            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dimensões (cm)</p>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Altura:</p>
                <p className="font-semibold">
                  {produto.altura ? (
                    `${Number(produto.altura).toFixed(2)} cm`
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Largura:</p>
                <p className="font-semibold">
                  {produto.largura ? (
                    `${Number(produto.largura).toFixed(2)} cm`
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Profundidade:</p>
                <p className="font-semibold">
                  {produto.profundidade ? (
                    `${Number(produto.profundidade).toFixed(2)} cm`
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
              </div>
            </div>

            {produto.altura && produto.largura && produto.profundidade && (
              <div className="pt-3 border-t bg-slate-50 -mx-6 px-6 py-3 -mb-6">
                <p className="text-sm text-muted-foreground">Volume Total</p>
                <p className="text-lg font-bold text-slate-700">
                  {(
                    Number(produto.altura) *
                    Number(produto.largura) *
                    Number(produto.profundidade) /
                    1000
                  ).toFixed(3)}{' '}
                  litros
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fornecedor Preferencial */}
      {produto.fornecedor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fornecedor Preferencial
            </CardTitle>
            <CardDescription>
              Fornecedor recomendado para compra deste produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Razão Social</p>
                <p className="text-lg font-semibold">{produto.fornecedor.razao_social}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-mono font-semibold">{produto.fornecedor.cnpj}</p>
              </div>
              <div className="pt-2">
                <Link href={`/fornecedores/${produto.fornecedor.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Ver detalhes do fornecedor
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Especificações e Observações */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Especificações Técnicas
            </CardTitle>
            <CardDescription>
              Detalhes técnicos e características do produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {produto.especificacoes ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {produto.especificacoes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma especificação cadastrada
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observações
            </CardTitle>
            <CardDescription>
              Anotações e informações adicionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            {produto.observacoes ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {produto.observacoes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma observação cadastrada
              </p>
            )}
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
