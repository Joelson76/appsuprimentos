import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
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
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { AprovarRequisicaoButton } from '@/components/requisicoes/aprovar-button'

interface PageProps {
  params: {
    id: string
  }
}

export default async function RequisicaoDetalhesPage({ params }: PageProps) {
  const supabase = await createClient()

  // Buscar usuário logado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar profile do usuário logado
  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil, tenant_id')
    .eq('id', user.id)
    .single()

  // Buscar requisição
  const { data: requisicao } = await supabase
    .from('requisicoes')
    .select(
      `
      *,
      solicitante:profiles!requisicoes_solicitante_id_fkey (nome, email),
      aprovador:profiles!requisicoes_aprovado_por_fkey (nome),
      itens_requisicao (*)
    `
    )
    .eq('id', params.id)
    .single()

  if (!requisicao) {
    notFound()
  }

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
        {status.replace(/_/g, ' ')}
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

  // Verificar se usuário pode aprovar (ADMIN ou GESTOR)
  const podeAprovar =
    (profile?.perfil === 'ADMIN' || profile?.perfil === 'GESTOR') &&
    requisicao.status === 'AGUARDANDO_APROVACAO'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/requisicoes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              Requisição {requisicao.numero}
            </h1>
            <p className="text-muted-foreground mt-1">
              Detalhes da requisição de compra
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(requisicao.status)}
          {getUrgenciaBadge(requisicao.urgencia)}
        </div>
      </div>

      {podeAprovar && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">
              Aprovação Pendente
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Esta requisição está aguardando sua aprovação
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <AprovarRequisicaoButton
              requisicaoId={requisicao.id}
              aprovar={true}
            />
            <AprovarRequisicaoButton
              requisicaoId={requisicao.id}
              aprovar={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Informações Gerais */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Número:</span>
              <span className="text-sm font-medium font-mono">
                {requisicao.numero}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Solicitante:
              </span>
              <span className="text-sm font-medium">
                {requisicao.solicitante?.nome}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Criada em:
              </span>
              <span className="text-sm font-medium">
                {formatDate(requisicao.criado_em)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Urgência:</span>
              {getUrgenciaBadge(requisicao.urgencia)}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(requisicao.status)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aprovação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requisicao.aprovado_por && requisicao.aprovado_em ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Aprovado por:
                  </span>
                  <span className="text-sm font-medium">
                    {requisicao.aprovador?.nome}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Aprovado em:
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(requisicao.aprovado_em)}
                  </span>
                </div>
                {requisicao.observacoes_aprovacao && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground block mb-1">
                      Observações:
                    </span>
                    <p className="text-sm">{requisicao.observacoes_aprovacao}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda não aprovada
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Descrição */}
      <Card>
        <CardHeader>
          <CardTitle>Descrição / Justificativa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{requisicao.descricao || '-'}</p>
        </CardContent>
      </Card>

      {/* Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Requisição</CardTitle>
          <CardDescription>
            {requisicao.itens_requisicao?.length || 0} item(ns) solicitado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Valor Estimado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisicao.itens_requisicao?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.descricao}</TableCell>
                  <TableCell className="text-right">
                    {item.quantidade}
                  </TableCell>
                  <TableCell>{item.unidade}</TableCell>
                  <TableCell className="text-right">
                    {item.valor_estimado
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.valor_estimado)
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="mt-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Requisição criada</p>
                <p className="text-xs text-muted-foreground">
                  por {requisicao.solicitante?.nome} em{' '}
                  {formatDate(requisicao.criado_em)}
                </p>
              </div>
            </div>

            {requisicao.status === 'APROVADA' && requisicao.aprovado_em && (
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Requisição aprovada</p>
                  <p className="text-xs text-muted-foreground">
                    por {requisicao.aprovador?.nome} em{' '}
                    {formatDate(requisicao.aprovado_em)}
                  </p>
                </div>
              </div>
            )}

            {requisicao.status === 'REPROVADA' && requisicao.aprovado_em && (
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Requisição reprovada</p>
                  <p className="text-xs text-muted-foreground">
                    por {requisicao.aprovador?.nome} em{' '}
                    {formatDate(requisicao.aprovado_em)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
