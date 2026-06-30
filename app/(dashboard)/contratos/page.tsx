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
import { Plus, AlertTriangle, FileText, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Contrato } from '@/lib/types'
import { NovoContratoDialog } from '@/components/contratos/novo-contrato-dialog'
import Link from 'next/link'

export default async function ContratosPage() {
  const supabase = await createClient()

  // Buscar contratos
  const { data: contratos } = await supabase
    .from('contratos')
    .select(
      `
      *,
      fornecedores (razao_social)
    `
    )
    .order('fim', { ascending: true })

  // Buscar fornecedores para o select
  const { data: fornecedores } = await supabase
    .from('fornecedores')
    .select('id, razao_social')
    .order('razao_social')

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ATIVO: 'bg-green-100 text-green-800',
      VENCENDO: 'bg-yellow-100 text-yellow-800',
      VENCIDO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-slate-100 text-slate-800',
      EM_RENOVACAO: 'bg-blue-100 text-blue-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getDiasRestantes = (dataFim: string) => {
    const hoje = new Date()
    const fim = new Date(dataFim)
    const diffTime = fim.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDiasRestantesBadge = (dias: number) => {
    if (dias < 0) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700">
          Vencido há {Math.abs(dias)} dias
        </Badge>
      )
    } else if (dias <= 7) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700">
          {dias} dias restantes
        </Badge>
      )
    } else if (dias <= 30) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          {dias} dias restantes
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          {dias} dias restantes
        </Badge>
      )
    }
  }

  const valorTotal =
    contratos?.reduce((acc, c) => acc + Number(c.valor_total || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie contratos com fornecedores
          </p>
        </div>
        <NovoContratoDialog fornecedores={fornecedores || []} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contratos?.length || 0}</div>
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
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contratos?.filter((c) => c.status === 'ATIVO').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencendo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {contratos?.filter((c) => c.status === 'VENCENDO').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos</CardTitle>
          <CardDescription>
            {contratos?.length || 0} contrato(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tempo Restante</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos && contratos.length > 0 ? (
                contratos.map((contrato: any) => (
                  <TableRow key={contrato.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{contrato.titulo}</div>
                        {contrato.numero && (
                          <div className="text-sm text-muted-foreground">
                            Nº {contrato.numero}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contrato.fornecedores?.razao_social || '-'}
                    </TableCell>
                    <TableCell>
                      {contrato.valor_total
                        ? formatCurrency(contrato.valor_total)
                        : '-'}
                    </TableCell>
                    <TableCell>{formatDate(contrato.inicio)}</TableCell>
                    <TableCell>{formatDate(contrato.fim)}</TableCell>
                    <TableCell>{getStatusBadge(contrato.status)}</TableCell>
                    <TableCell>
                      {getDiasRestantesBadge(getDiasRestantes(contrato.fim))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {contrato.arquivo_path && (
                          <a href={contrato.arquivo_path} target="_blank" rel="noopener noreferrer" download>
                            <Button variant="ghost" size="sm" title="Baixar arquivo">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        <Link href={`/contratos/${contrato.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="mr-1 h-4 w-4" />
                            Detalhes
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhum contrato cadastrado
                    </div>
                    <div className="mt-4">
                      <NovoContratoDialog fornecedores={fornecedores || []} />
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
