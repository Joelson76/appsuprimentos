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
import { Plus, Star } from 'lucide-react'
import { formatCNPJ, formatDate } from '@/lib/utils'
import type { Fornecedor } from '@/lib/types'

export default async function FornecedoresPage() {
  const supabase = await createClient()

  const { data: fornecedores } = await supabase
    .from('fornecedores')
    .select('*')
    .order('razao_social')

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ATIVO: 'bg-green-100 text-green-800',
      INATIVO: 'bg-slate-100 text-slate-800',
      BLOQUEADO: 'bg-red-100 text-red-800',
      EM_HOMOLOGACAO: 'bg-yellow-100 text-yellow-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const renderScore = (score: number) => {
    const stars = Math.round(score / 2)
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < stars
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          ({score.toFixed(1)})
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua base de fornecedores
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
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
            <div className="text-2xl font-bold">{fornecedores?.length || 0}</div>
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
              {fornecedores?.filter((f) => f.status === 'ATIVO').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Homologação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {fornecedores?.filter((f) => f.status === 'EM_HOMOLOGACAO')
                .length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fornecedores && fornecedores.length > 0
                ? (
                    fornecedores.reduce((acc, f) => acc + (f.score || 0), 0) /
                    fornecedores.length
                  ).toFixed(1)
                : '0.0'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <CardDescription>
            {fornecedores?.length || 0} fornecedor(es) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedores && fornecedores.length > 0 ? (
                fornecedores.map((fornecedor: Fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{fornecedor.razao_social}</div>
                        {fornecedor.nome_fantasia && (
                          <div className="text-sm text-muted-foreground">
                            {fornecedor.nome_fantasia}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCNPJ(fornecedor.cnpj)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {fornecedor.email && <div>{fornecedor.email}</div>}
                        {fornecedor.telefone && (
                          <div className="text-muted-foreground">
                            {fornecedor.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(fornecedor.status)}</TableCell>
                    <TableCell>{renderScore(fornecedor.score)}</TableCell>
                    <TableCell>{formatDate(fornecedor.criado_em)}</TableCell>
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
                      Nenhum fornecedor cadastrado
                    </div>
                    <Button className="mt-4" variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar Primeiro Fornecedor
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
