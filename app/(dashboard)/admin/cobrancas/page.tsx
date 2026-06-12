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
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function CobrancasPage() {
  const supabase = await createClient()

  // Buscar todas as faturas (apenas SUPER_ADMIN ou ADMIN)
  const { data: faturas } = await supabase
    .from('faturas')
    .select(
      `
      *,
      tenant:tenants!faturas_tenant_id_fkey (nome, cnpj)
    `
    )
    .order('criado_em', { ascending: false })

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      PAGO: 'bg-green-100 text-green-800',
      VENCIDO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-slate-100 text-slate-800',
      ESTORNADO: 'bg-orange-100 text-orange-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status}
      </Badge>
    )
  }

  // KPIs
  const totalFaturado =
    faturas?.filter((f) => f.status === 'PAGO').reduce((acc, f) => acc + Number(f.valor), 0) || 0

  const totalPendente =
    faturas?.filter((f) => f.status === 'PENDENTE').reduce((acc, f) => acc + Number(f.valor), 0) || 0

  const totalVencido =
    faturas?.filter((f) => f.status === 'VENCIDO').reduce((acc, f) => acc + Number(f.valor), 0) || 0

  const taxaPagamento =
    faturas && faturas.length > 0
      ? (faturas.filter((f) => f.status === 'PAGO').length / faturas.length) * 100
      : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cobranças</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de faturas e pagamentos
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Faturado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalFaturado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalPendente)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {formatCurrency(totalVencido)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {taxaPagamento.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Faturas</CardTitle>
          <CardDescription>
            {faturas?.length || 0} fatura(s) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faturas && faturas.length > 0 ? (
                faturas.map((fatura: any) => (
                  <TableRow key={fatura.id}>
                    <TableCell className="font-mono font-medium">
                      {fatura.numero}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {fatura.tenant?.nome || '-'}
                        </div>
                        {fatura.tenant?.cnpj && (
                          <div className="text-sm text-muted-foreground">
                            {fatura.tenant.cnpj}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(fatura.valor)}
                    </TableCell>
                    <TableCell>
                      <div>
                        {formatDate(fatura.vencimento)}
                        {new Date(fatura.vencimento) < new Date() &&
                          fatura.status === 'PENDENTE' && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-red-50 text-red-700"
                            >
                              Vencido
                            </Badge>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {fatura.pagamento_em
                        ? formatDate(fatura.pagamento_em)
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(fatura.status)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/cobrancas/${fatura.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-1 h-4 w-4" />
                          Detalhes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhuma fatura registrada
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
