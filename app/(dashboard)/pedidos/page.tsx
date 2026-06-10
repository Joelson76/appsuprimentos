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
import { Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { OrdemCompra } from '@/lib/types'

export default async function PedidosPage() {
  const supabase = await createClient()

  const { data: pedidos } = await supabase
    .from('ordens_compra')
    .select(
      `
      *,
      fornecedores (razao_social)
    `
    )
    .order('criado_em', { ascending: false })

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      RASCUNHO: 'bg-slate-100 text-slate-800',
      AGUARDANDO_APROVACAO: 'bg-yellow-100 text-yellow-800',
      APROVADA: 'bg-green-100 text-green-800',
      ENVIADA_FORNECEDOR: 'bg-blue-100 text-blue-800',
      CONFIRMADA: 'bg-teal-100 text-teal-800',
      EM_TRANSITO: 'bg-purple-100 text-purple-800',
      PARCIALMENTE_RECEBIDA: 'bg-orange-100 text-orange-800',
      RECEBIDA: 'bg-green-100 text-green-800',
      FATURADA: 'bg-slate-100 text-slate-800',
      CANCELADA: 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const valorTotal =
    pedidos?.reduce((acc, p) => acc + Number(p.valor_total || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pedidos de Compra</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as ordens de compra
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de POs
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
              Aguardando Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pedidos?.filter((p) => p.status === 'AGUARDANDO_APROVACAO')
                .length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Trânsito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {pedidos?.filter((p) => p.status === 'EM_TRANSITO').length || 0}
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
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Prazo Entrega</TableHead>
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
                    <TableCell>
                      {pedido.fornecedores?.razao_social || '-'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(pedido.valor_total)}
                    </TableCell>
                    <TableCell>
                      {pedido.prazo_entrega
                        ? formatDate(pedido.prazo_entrega)
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                    <TableCell>{formatDate(pedido.criado_em)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhum pedido encontrado
                    </div>
                    <Button className="mt-4" variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Pedido
                    </Button>
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
