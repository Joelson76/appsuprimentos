import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
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
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  Truck,
  XCircle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { AprovarPedidoButton } from '@/components/pedidos/aprovar-pedido-button'
import { CancelarPedidoButton } from '@/components/pedidos/cancelar-pedido-button'
import { EnviarFornecedorButton } from '@/components/pedidos/enviar-fornecedor-button'
import { ConfirmarRecebimentoButton } from '@/components/pedidos/confirmar-recebimento-button'

interface PageProps {
  params: {
    id: string
  }
}

export default async function PedidoDetalhesPage({ params }: PageProps) {
  const supabase = await createClient()
  const { id } = params

  console.log('🔍 Buscando pedido:', id)

  // Buscar pedido com todas as relações
  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select(
      `
      *,
      fornecedores (
        id,
        razao_social,
        nome_fantasia,
        cnpj,
        email,
        telefone,
        endereco,
        status
      ),
      cotacoes (
        id,
        numero
      ),
      itens_pedido (
        id,
        descricao,
        quantidade,
        valor_unitario,
        prazo_entrega,
        quantidade_recebida,
        observacoes
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('❌ Erro ao buscar pedido:', error)
    notFound()
  }

  if (!pedido) {
    console.log('⚠️  Pedido não encontrado:', id)
    notFound()
  }

  console.log('✅ Pedido encontrado:', pedido.numero)

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      APROVADO: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
      ENVIADO: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
      CONFIRMADO: { label: 'Confirmado', color: 'bg-teal-100 text-teal-800' },
      EM_ENTREGA: { label: 'Em Entrega', color: 'bg-purple-100 text-purple-800' },
      PARCIALMENTE_RECEBIDO: {
        label: 'Parcial',
        color: 'bg-orange-100 text-orange-800',
      },
      RECEBIDO: { label: 'Recebido', color: 'bg-green-100 text-green-800' },
      CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    }

    const statusInfo =
      statusMap[status] || { label: status, color: 'bg-slate-100 text-slate-800' }

    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
  }

  const valorTotalItens = pedido.itens_pedido.reduce(
    (acc: number, item: any) =>
      acc + Number(item.quantidade) * Number(item.valor_unitario),
    0
  )

  const quantidadeItens = pedido.itens_pedido.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pedidos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-mono">{pedido.numero}</h1>
              {getStatusBadge(pedido.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              {pedido.cotacoes?.numero && (
                <>
                  Cotação:{' '}
                  <Link
                    href={`/cotacoes/${pedido.cotacao_id}`}
                    className="font-mono hover:underline"
                  >
                    {pedido.cotacoes.numero}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {pedido.status === 'PENDENTE' && (
            <>
              <CancelarPedidoButton
                pedidoId={pedido.id}
                numero={pedido.numero}
              />
              <AprovarPedidoButton
                pedidoId={pedido.id}
                numero={pedido.numero}
              />
            </>
          )}
          {pedido.status === 'APROVADO' && (
            <EnviarFornecedorButton
              pedidoId={pedido.id}
              numero={pedido.numero}
              fornecedorEmail={pedido.fornecedores.email}
            />
          )}
          {(pedido.status === 'ENVIADO' ||
            pedido.status === 'PARCIALMENTE_RECEBIDO') && (
            <ConfirmarRecebimentoButton
              pedidoId={pedido.id}
              numero={pedido.numero}
              itens={pedido.itens_pedido}
            />
          )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pedido.valor_total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quantidadeItens}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Data Emissão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {formatDate(pedido.data_emissao)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entrega Prevista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {pedido.data_entrega_prevista
                ? formatDate(pedido.data_entrega_prevista)
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Fornecedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Razão Social</p>
              <p className="font-semibold">
                {pedido.fornecedores.razao_social}
              </p>
            </div>
            {pedido.fornecedores.nome_fantasia && (
              <div>
                <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                <p className="font-medium">
                  {pedido.fornecedores.nome_fantasia}
                </p>
              </div>
            )}
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-mono">{pedido.fornecedores.cnpj}</p>
            </div>
            {pedido.fornecedores.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{pedido.fornecedores.email}</p>
              </div>
            )}
            {pedido.fornecedores.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{pedido.fornecedores.telefone}</p>
              </div>
            )}
            {pedido.fornecedores.endereco && (
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="text-sm whitespace-pre-wrap">
                  {pedido.fornecedores.endereco}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Número do Pedido</p>
              <p className="font-mono font-bold">{pedido.numero}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(pedido.status)}</div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">
                Condição de Pagamento
              </p>
              <p className="font-medium">
                {pedido.condicao_pagamento || 'Não informado'}
              </p>
            </div>
            {pedido.observacoes && (
              <div>
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="text-sm whitespace-pre-wrap">
                  {pedido.observacoes}
                </p>
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(pedido.criado_em)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">
                  {formatDate(pedido.atualizado_em)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
          <CardDescription>{quantidadeItens} item(ns)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Valor Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Prazo</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead>Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedido.itens_pedido.map((item: any) => {
                const total =
                  Number(item.quantidade) * Number(item.valor_unitario)
                const percentualRecebido =
                  (Number(item.quantidade_recebida) / Number(item.quantidade)) *
                  100

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.descricao}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantidade).toLocaleString('pt-BR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 3,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.valor_unitario)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(total)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.prazo_entrega ? (
                        <span className="flex items-center justify-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {item.prazo_entrega} dias
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm">
                          {Number(item.quantidade_recebida).toLocaleString(
                            'pt-BR',
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 3,
                            }
                          )}
                        </span>
                        {percentualRecebido > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {percentualRecebido.toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.observacoes || '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={3} className="text-right">
                  Total do Pedido
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(valorTotalItens)}
                </TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
