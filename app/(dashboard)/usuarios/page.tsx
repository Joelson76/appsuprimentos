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

export default async function UsuariosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Buscar todos os usuários do mesmo tenant (RLS filtra automaticamente)
  const { data: usuarios } = await supabase
    .from('profiles')
    .select('*')
    .order('criado_em', { ascending: false })

  const getPerfilBadge = (perfil: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-red-100 text-red-800',
      ADMIN: 'bg-purple-100 text-purple-800',
      GESTOR: 'bg-blue-100 text-blue-800',
      COMPRADOR: 'bg-green-100 text-green-800',
      SOLICITANTE: 'bg-yellow-100 text-yellow-800',
      ALMOXARIFE: 'bg-orange-100 text-orange-800',
      FINANCEIRO: 'bg-cyan-100 text-cyan-800',
    }
    return (
      <Badge className={colors[perfil] || 'bg-slate-100 text-slate-800'}>
        {perfil}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários da sua empresa
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Convidar Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>
            Total de {usuarios?.length || 0} usuário(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios && usuarios.length > 0 ? (
                usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">
                      {usuario.nome}
                      {usuario.id === user!.id && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Você
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getPerfilBadge(usuario.perfil)}</TableCell>
                    <TableCell>
                      {usuario.ativo ? (
                        <Badge className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(usuario.criado_em)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Nenhum usuário encontrado
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
