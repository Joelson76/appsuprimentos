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
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function CotacoesPage() {
  const supabase = await createClient()

  const { data: cotacoes } = await supabase
    .from('cotacoes')
    .select(
      `
      *,
      requisicao:requisicoes (numero)
    `
    )
    .order('criado_em', { ascending: false })

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ABERTA: 'bg-green-100 text-green-800',
      AGUARDANDO_RESPOSTAS: 'bg-yellow-100 text-yellow-800',
      RESPOSTAS_PARCIAIS: 'bg-orange-100 text-orange-800',
      EM_ANALISE: 'bg-purple-100 text-purple-800',
      ENCERRADA: 'bg-blue-100 text-blue-800',
      CANCELADA: 'bg-slate-100 text-slate-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cotações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie cotações com fornecedores
          </p>
        </div>
        <Link href="/cotacoes/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Cotação
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cotacoes?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cotacoes?.filter((c) => c.status === 'ABERTA').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando Respostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {cotacoes?.filter((c) => c.status === 'AGUARDANDO_RESPOSTAS')
                .length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Encerradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {cotacoes?.filter((c) => c.status === 'ENCERRADA').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotações</CardTitle>
          <CardDescription>
            {cotacoes?.length || 0} cotação(ões) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Requisição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Limite</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotacoes && cotacoes.length > 0 ? (
                cotacoes.map((cot: any) => (
                  <TableRow key={cot.id}>
                    <TableCell className="font-mono font-medium">
                      {cot.numero}
                    </TableCell>
                    <TableCell>
                      {cot.requisicao?.numero || 'Sem requisição'}
                    </TableCell>
                    <TableCell>{getStatusBadge(cot.status)}</TableCell>
                    <TableCell>{formatDate(cot.data_limite)}</TableCell>
                    <TableCell>{formatDate(cot.criado_em)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/cotacoes/${cot.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhuma cotação encontrada
                    </div>
                    <Link href="/cotacoes/nova">
                      <Button className="mt-4" variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Primeira Cotação
                      </Button>
                    </Link>
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
