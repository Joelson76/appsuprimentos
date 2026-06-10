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
import type { Requisicao } from '@/lib/types'

export default async function RequisicoesPage() {
  const supabase = await createClient()

  const { data: requisicoes } = await supabase
    .from('requisicoes')
    .select(
      `
      *,
      profiles!requisicoes_solicitante_id_fkey (nome)
    `
    )
    .order('criado_em', { ascending: false })

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      RASCUNHO: 'bg-slate-100 text-slate-800',
      AGUARDANDO_APROVACAO: 'bg-yellow-100 text-yellow-800',
      APROVADA: 'bg-green-100 text-green-800',
      REPROVADA: 'bg-red-100 text-red-800',
      EM_COTACAO: 'bg-blue-100 text-blue-800',
      PEDIDO_GERADO: 'bg-purple-100 text-purple-800',
      CANCELADA: 'bg-slate-100 text-slate-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getUrgenciaBadge = (urgencia: string) => {
    const colors: Record<string, string> = {
      BAIXA: 'bg-slate-100 text-slate-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      ALTA: 'bg-orange-100 text-orange-800',
      CRITICA: 'bg-red-100 text-red-800',
    }
    return (
      <Badge variant="outline" className={colors[urgencia]}>
        {urgencia}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Requisições de Compra</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as requisições de compra
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Requisição
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requisicoes?.length || 0}
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
              {requisicoes?.filter((r) => r.status === 'AGUARDANDO_APROVACAO')
                .length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requisicoes?.filter((r) => r.status === 'APROVADA').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Cotação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requisicoes?.filter((r) => r.status === 'EM_COTACAO').length ||
                0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Requisições</CardTitle>
          <CardDescription>
            {requisicoes?.length || 0} requisição(ões) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Urgência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisicoes && requisicoes.length > 0 ? (
                requisicoes.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono font-medium">
                      {req.numero}
                    </TableCell>
                    <TableCell>{req.profiles?.nome || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {req.descricao || '-'}
                    </TableCell>
                    <TableCell>{getUrgenciaBadge(req.urgencia)}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>{formatDate(req.criado_em)}</TableCell>
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
                      Nenhuma requisição encontrada
                    </div>
                    <Button className="mt-4" variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Requisição
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
