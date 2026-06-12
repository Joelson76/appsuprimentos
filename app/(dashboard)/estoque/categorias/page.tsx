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
import { ArrowLeft, Folder } from 'lucide-react'
import Link from 'next/link'
import { NovaCategoriaDialog } from '@/components/estoque/nova-categoria-dialog'
import { EditarCategoriaDialog } from '@/components/estoque/editar-categoria-dialog'
import { ToggleAtivoButton } from '@/components/estoque/toggle-ativo-button'

export default async function CategoriasPage() {
  const supabase = await createClient()

  // Buscar categorias com contagem de produtos
  const { data: categorias } = await supabase
    .from('categorias')
    .select(`
      *,
      produtos:produtos(count)
    `)
    .order('nome')

  const totalCategorias = categorias?.length || 0
  const categoriasAtivas = categorias?.filter((c) => c.ativo).length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Categorias de Produtos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as categorias do estoque
            </p>
          </div>
        </div>
        <NovaCategoriaDialog />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategorias}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorias Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {categoriasAtivas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorias Inativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-400">
              {totalCategorias - categoriasAtivas}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
          <CardDescription>
            {totalCategorias} categoria(s) cadastrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias && categorias.length > 0 ? (
                categorias.map((categoria: any) => (
                  <TableRow key={categoria.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{categoria.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoria.produtos[0]?.count || 0} produto(s)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {categoria.ativo ? (
                        <Badge className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-800">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <EditarCategoriaDialog categoria={categoria} />
                      <ToggleAtivoButton
                        categoriaId={categoria.id}
                        ativo={categoria.ativo}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhuma categoria cadastrada
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
