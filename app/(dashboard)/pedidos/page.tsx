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
import { Plus, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function PedidosPage() {
  const supabase = await createClient()

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select(
      `
      *,
      fornecedores (
        id,
        razao_social,
        nome_fantasia
      ),
      cotacoes (
        numero
      )
    `
    )
    .order('criado_em', { ascending: false })

  if (error) {
    console.error('Erro ao buscar pedidos:', error)
  }

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

  const valorTotal =
    pedidos?.reduce((acc, p) => acc + Number(p.valor_total || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pedidos de Compra</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os pedidos gerados a partir das cotações aprovadas
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidos?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(valorTotal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pedidos?.filter((p) => p.status === 'PENDENTE').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {pedidos?.filter((p) => p.status === 'EM_ENTREGA').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
          <CardDescription>
            {pedidos?.length || 0} pedido(s) registrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cotação</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos && pedidos.length > 0 ? (
                pedidos.map((pedido: any) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-mono font-medium">
                      {pedido.numero}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {pedido.cotacoes?.numero || '-'}
                    </TableCell>
                    <TableCell>
                      {pedido.fornecedores?.nome_fantasia ||
                        pedido.fornecedores?.razao_social ||
                        '-'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(pedido.valor_total)}
                    </TableCell>
                    <TableCell>
                      {pedido.data_entrega_prevista
                        ? formatDate(pedido.data_entrega_prevista)
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(pedido.criado_em)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/pedidos/${pedido.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhum pedido encontrado
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Pedidos são gerados automaticamente a partir de cotações
                      aprovadas
                    </p>
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
