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
import { Users, UserCheck, UserX, Shield } from 'lucide-react'
import { ConvidarUsuarioDialog } from '@/components/usuarios/convidar-usuario-dialog'
import { EditarUsuarioDialog } from '@/components/usuarios/editar-usuario-dialog'
import { ToggleAtivoUsuarioButton } from '@/components/usuarios/toggle-ativo-usuario-button'
import { SimpleEditButton } from '@/components/usuarios/simple-edit-button'

export default async function UsuariosPage() {
  const supabase = await createClient()

  // Buscar usuários do tenant
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, perfil')
    .eq('id', user?.id || '')
    .single()

  // Verificar se é admin
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(profile?.perfil || '')

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Acesso restrito a administradores
        </p>
      </div>
    )
  }

  // Buscar todos os usuários do tenant
  const { data: usuarios } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', profile?.tenant_id || '')
    .order('nome')

  // KPIs
  const totalUsuarios = usuarios?.length || 0
  const usuariosAtivos = usuarios?.filter((u) => u.ativo).length || 0
  const admins = usuarios?.filter((u) =>
    ['SUPER_ADMIN', 'ADMIN'].includes(u.perfil)
  ).length || 0

  const getPerfilBadge = (perfil: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-blue-100 text-blue-800',
      GESTOR: 'bg-green-100 text-green-800',
      COMPRADOR: 'bg-yellow-100 text-yellow-800',
      SOLICITANTE: 'bg-slate-100 text-slate-800',
      ALMOXARIFE: 'bg-orange-100 text-orange-800',
      FINANCEIRO: 'bg-teal-100 text-teal-800',
    }
    return (
      <Badge className={colors[perfil] || 'bg-slate-100 text-slate-800'}>
        {perfil.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários da sua empresa
          </p>
        </div>
        <ConvidarUsuarioDialog />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsuarios}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {usuariosAtivos}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Usuários Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-400">
              {totalUsuarios - usuariosAtivos}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {totalUsuarios} usuário(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios && usuarios.length > 0 ? (
                usuarios.map((usuario: any) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{usuario.nome}</p>
                        {usuario.id === user?.id && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Você
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {usuario.email}
                    </TableCell>
                    <TableCell>{getPerfilBadge(usuario.perfil)}</TableCell>
                    <TableCell>
                      {usuario.ativo ? (
                        <Badge className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <SimpleEditButton nome={usuario.nome} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhum usuário encontrado
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
