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
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import EnviarLinksButton from '@/components/cotacoes/enviar-links-button'

interface PageProps {
  params: {
    id: string
  }
}

export default async function CotacaoDetalhesPage({ params }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: cotacao, error } = await supabase
    .from('cotacoes')
    .select(
      `
      *,
      requisicao:requisicoes (numero, descricao)
    `
    )
    .eq('id', params.id)
    .single()

  if (error) {
    console.error('Erro ao buscar cotação:', error)
  }

  if (!cotacao) {
    notFound()
  }

  // Buscar itens da cotação agrupados por fornecedor
  const { data: itens } = await supabase
    .from('itens_cotacao')
    .select(
      `
      *,
      fornecedor:fornecedores (razao_social, nome_fantasia)
    `
    )
    .eq('cotacao_id', params.id)

  // Agrupar itens por fornecedor
  const itensPorFornecedor = itens?.reduce((acc: any, item: any) => {
    const fornecedorId = item.fornecedor_id
    if (!acc[fornecedorId]) {
      acc[fornecedorId] = {
        fornecedor: item.fornecedor,
        fornecedor_id: fornecedorId,
        itens: [],
      }
    }
    acc[fornecedorId].itens.push(item)
    return acc
  }, {})

  // Lista de fornecedores únicos para o botão de enviar links
  const fornecedoresList = itensPorFornecedor
    ? Object.values(itensPorFornecedor).map((data: any) => ({
        id: data.fornecedor_id,
        razao_social: data.fornecedor?.razao_social || 'Desconhecido',
        nome_fantasia: data.fornecedor?.nome_fantasia,
        email: data.fornecedor?.email,
      }))
    : []

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      ABERTA: (
        <span className="inline-flex items-center rounded-md border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
          ABERTA
        </span>
      ),
      AGUARDANDO_RESPOSTAS: (
        <span className="inline-flex items-center rounded-md border border-yellow-200 bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
          AGUARDANDO RESPOSTAS
        </span>
      ),
      ENCERRADA: (
        <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
          ENCERRADA
        </span>
      ),
      CANCELADA: (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
          CANCELADA
        </span>
      ),
    }
    return (
      badges[status] || (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
          {status}
        </span>
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cotacoes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Cotação {cotacao.numero}</h1>
            <p className="text-muted-foreground mt-1">
              Detalhes e propostas dos fornecedores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(cotacao.status)}
          {fornecedoresList.length > 0 && (
            <EnviarLinksButton
              cotacaoId={cotacao.id}
              fornecedores={fornecedoresList}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações da Cotação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações da Cotação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Número:</span>
              <span className="text-sm font-medium font-mono">
                {cotacao.numero}
              </span>
            </div>
            {cotacao.requisicao && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Requisição:
                </span>
                <Link
                  href={`/requisicoes/${cotacao.requisicao_id}`}
                  className="text-sm font-medium font-mono text-primary hover:underline"
                >
                  {cotacao.requisicao.numero}
                </Link>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(cotacao.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Criada em:
              </span>
              <span className="text-sm font-medium">
                {formatDate(cotacao.criado_em)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Prazos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prazos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Data Limite para Respostas:
              </span>
              <span className="text-sm font-medium">
                {formatDate(cotacao.data_limite)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Fornecedores Convidados:
              </span>
              <span className="text-sm font-medium">
                {itensPorFornecedor
                  ? Object.keys(itensPorFornecedor).length
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens por Fornecedor */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Propostas dos Fornecedores</h2>

        {itensPorFornecedor && Object.keys(itensPorFornecedor).length > 0 ? (
          Object.entries(itensPorFornecedor).map(
            ([fornecedorId, data]: [string, any]) => (
              <Card key={fornecedorId}>
                <CardHeader>
                  <CardTitle>
                    {data.fornecedor?.nome_fantasia ||
                      data.fornecedor?.razao_social ||
                      'Fornecedor não encontrado'}
                  </CardTitle>
                  <CardDescription>
                    {data.itens.length} item(ns) cotado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">
                          Quantidade
                        </TableHead>
                        <TableHead className="text-right">Unidade</TableHead>
                        <TableHead className="text-right">
                          Valor Unit.
                        </TableHead>
                        <TableHead className="text-right">
                          Valor Total
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.itens.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell className="text-right">
                            {item.quantidade}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.unidade}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.preco_unitario
                              ? new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(item.preco_unitario)
                              : 'Aguardando'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.preco_unitario
                              ? new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(item.preco_unitario * item.quantidade)
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold">
                          Total Geral:
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {data.itens.some((i: any) => i.preco_unitario)
                            ? new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(
                                data.itens.reduce(
                                  (sum: number, item: any) =>
                                    sum +
                                    (item.preco_unitario || 0) *
                                      item.quantidade,
                                  0
                                )
                              )
                            : 'Aguardando proposta'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          )
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum fornecedor convidado para esta cotação
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
