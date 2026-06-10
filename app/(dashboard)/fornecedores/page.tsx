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
import Link from 'next/link'

export default async function FornecedoresPage() {
  const supabase = await createClient()

  const { data: fornecedores } = await supabase
    .from('fornecedores')
    .select('*')
    .order('razao_social')

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      ATIVO: (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          ATIVO
        </Badge>
      ),
      INATIVO: (
        <Badge className="bg-slate-100 text-slate-800 border-slate-200">
          INATIVO
        </Badge>
      ),
      BLOQUEADO: (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          BLOQUEADO
        </Badge>
      ),
      EM_HOMOLOGACAO: (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          EM HOMOLOGAÇÃO
        </Badge>
      ),
    }
    return (
      badges[status] || (
        <Badge className="bg-slate-100 text-slate-800 border-slate-200">
          {status.replace(/_/g, ' ')}
        </Badge>
      )
    )
  }

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus fornecedores e parceiros
          </p>
        </div>
        <Link href="/fornecedores/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
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
            <div className="text-2xl font-bold">
              {fornecedores?.length || 0}
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
            <div className="text-2xl font-bold text-blue-600">
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
                <TableHead>Nome Fantasia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedores && fornecedores.length > 0 ? (
                fornecedores.map((forn: any) => (
                  <TableRow key={forn.id}>
                    <TableCell className="font-medium">
                      {forn.razao_social}
                    </TableCell>
                    <TableCell>{forn.nome_fantasia || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCNPJ(forn.cnpj)}
                    </TableCell>
                    <TableCell>
                      {forn.categorias && forn.categorias.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {forn.categorias.slice(0, 2).map((cat: string) => (
                            <Badge key={cat} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {forn.categorias.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{forn.categorias.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{forn.score || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(forn.status)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/fornecedores/${forn.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhum fornecedor cadastrado
                    </div>
                    <Link href="/fornecedores/novo">
                      <Button className="mt-4" variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Cadastrar Primeiro Fornecedor
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
