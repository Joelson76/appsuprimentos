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
import { Plus, Download, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { NotaFiscal } from '@/lib/types'

export default async function NotasFiscaisPage() {
  const supabase = await createClient()

  const { data: notasFiscais } = await supabase
    .from('notas_fiscais')
    .select(
      `
      *,
      ordens_compra (numero, fornecedores (razao_social))
    `
    )
    .order('criado_em', { ascending: false })

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-slate-100 text-slate-800',
      CONFERIDA: 'bg-blue-100 text-blue-800',
      APROVADA: 'bg-green-100 text-green-800',
      DIVERGENTE: 'bg-red-100 text-red-800',
      DEVOLVIDA: 'bg-orange-100 text-orange-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status}
      </Badge>
    )
  }

  const valorTotal =
    notasFiscais?.reduce((acc, nf) => acc + Number(nf.valor_total || 0), 0) ||
    0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notas Fiscais</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e confira suas notas fiscais
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Processar NF-e
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de NFs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notasFiscais?.length || 0}
            </div>
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
              Conferidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {notasFiscais?.filter(
                (nf) => nf.status === 'CONFERIDA' || nf.status === 'APROVADA'
              ).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com Divergência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {notasFiscais?.filter((nf) => nf.status === 'DIVERGENTE')
                .length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Notas Fiscais</CardTitle>
          <CardDescription>
            {notasFiscais?.length || 0} nota(s) fiscal(is) processada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>PO</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Divergências</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasFiscais && notasFiscais.length > 0 ? (
                notasFiscais.map((nf: any) => (
                  <TableRow key={nf.id}>
                    <TableCell className="font-mono font-medium">
                      {nf.numero}
                      {nf.serie && (
                        <span className="text-muted-foreground">
                          {' '}
                          - Série {nf.serie}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {nf.ordens_compra?.numero || '-'}
                    </TableCell>
                    <TableCell>
                      {nf.ordens_compra?.fornecedores?.razao_social || '-'}
                    </TableCell>
                    <TableCell>{formatDate(nf.emissao)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(nf.valor_total)}
                    </TableCell>
                    <TableCell>{getStatusBadge(nf.status)}</TableCell>
                    <TableCell>
                      {nf.divergencias && nf.divergencias.length > 0 ? (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700"
                        >
                          {nf.divergencias.length} divergência(s)
                        </Badge>
                      ) : (
                        <span className="text-sm text-green-600">✓ OK</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {nf.xml_path && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          Detalhes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhuma nota fiscal processada
                    </div>
                    <Button className="mt-4" variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Processar Primeira NF-e
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
