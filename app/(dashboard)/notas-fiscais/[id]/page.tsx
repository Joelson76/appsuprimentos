import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { AprovarNFButton } from '@/components/notas-fiscais/aprovar-nf-button'
import { ReprovarNFButton } from '@/components/notas-fiscais/reprovar-nf-button'
import { ConferirNFButton } from '@/components/notas-fiscais/conferir-nf-button'

export default async function NotaFiscalDetalhesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: nf, error } = await supabase
    .from('notas_fiscais')
    .select(
      `
      *,
      pedido:pedidos!notas_fiscais_pedido_id_fkey (
        id,
        numero,
        valor_total,
        data_entrega_prevista,
        fornecedor:fornecedores (
          razao_social,
          cnpj,
          email
        ),
        itens_pedido (
          descricao,
          quantidade,
          valor_unitario
        )
      ),
      recebimento:recebimentos (
        id,
        status,
        criado_em,
        itens_recebimento (
          descricao,
          quantidade_pedida,
          quantidade_recebida,
          divergencia
        )
      )
    `
    )
    .eq('id', params.id)
    .single()

  if (error || !nf) {
    return notFound()
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      CONFERIDA: 'bg-blue-100 text-blue-800',
      APROVADA: 'bg-green-100 text-green-800',
      DIVERGENTE: 'bg-red-100 text-red-800',
      DEVOLVIDA: 'bg-orange-100 text-orange-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status}
      </Badge>
    )
  }

  // Calcular divergências
  const divergencias = []

  // Divergência de valor
  const difValor = Number(nf.valor_total) - Number(nf.pedido.valor_total)
  if (Math.abs(difValor) > 0.01) {
    divergencias.push({
      tipo: 'VALOR',
      descricao: `Divergência de valor: NF ${formatCurrency(nf.valor_total)} vs PO ${formatCurrency(nf.pedido.valor_total)}`,
      diferenca: difValor,
    })
  }

  // Divergências de recebimento (se houver)
  if (nf.recebimento) {
    const itensDivergentes = nf.recebimento.itens_recebimento?.filter(
      (item: any) => item.divergencia
    )
    if (itensDivergentes && itensDivergentes.length > 0) {
      divergencias.push({
        tipo: 'QUANTIDADE',
        descricao: `${itensDivergentes.length} item(ns) com divergência de quantidade`,
        itens: itensDivergentes,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/notas-fiscais">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              Nota Fiscal {nf.numero}
              {nf.serie && <span className="text-muted-foreground"> - Série {nf.serie}</span>}
            </h1>
            <p className="text-muted-foreground mt-1">
              {nf.pedido.fornecedor.razao_social}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(nf.status)}
          {nf.status === 'PENDENTE' && <ConferirNFButton nfId={nf.id} />}
          {nf.status === 'CONFERIDA' && (
            <>
              <AprovarNFButton nfId={nf.id} />
              <ReprovarNFButton nfId={nf.id} />
            </>
          )}
        </div>
      </div>

      {/* Alertas de Divergência */}
      {divergencias.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Divergências Encontradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {divergencias.map((div, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">{div.descricao}</p>
                    {div.tipo === 'VALOR' && (
                      <p className="text-sm text-red-700">
                        Diferença: {formatCurrency(Math.abs(div.diferenca))}{' '}
                        {div.diferenca > 0 ? '(NF maior)' : '(PO maior)'}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dados da NF-e */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados da NF-e
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Número</p>
                <p className="font-mono font-semibold">{nf.numero}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Série</p>
                <p className="font-mono font-semibold">{nf.serie || '-'}</p>
              </div>
            </div>

            {nf.chave_acesso && (
              <div>
                <p className="text-sm text-muted-foreground">Chave de Acesso</p>
                <p className="font-mono text-xs break-all">
                  {nf.chave_acesso}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data de Emissão</p>
                <p className="font-semibold">{formatDate(nf.emissao)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="font-semibold text-lg">
                  {formatCurrency(nf.valor_total)}
                </p>
              </div>
            </div>

            {nf.xml_path && (
              <Button variant="outline" className="w-full" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Baixar XML
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pedido de Compra */}
        <Card>
          <CardHeader>
            <CardTitle>Pedido de Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Número do Pedido</p>
              <Link href={`/pedidos/${nf.pedido.id}`}>
                <p className="font-mono font-semibold text-primary hover:underline">
                  {nf.pedido.numero}
                </p>
              </Link>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Fornecedor</p>
              <p className="font-semibold">
                {nf.pedido.fornecedor.razao_social}
              </p>
              <p className="text-sm text-muted-foreground">
                CNPJ: {nf.pedido.fornecedor.cnpj}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor do Pedido</p>
                <p className="font-semibold">
                  {formatCurrency(nf.pedido.valor_total)}
                </p>
              </div>
              {nf.pedido.data_entrega_prevista && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Entrega Prevista
                  </p>
                  <p className="font-semibold">
                    {formatDate(nf.pedido.data_entrega_prevista)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
          <CardDescription>
            {nf.pedido.itens_pedido?.length || 0} item(ns)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nf.pedido.itens_pedido?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.descricao}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantidade: {item.quantidade} x{' '}
                    {formatCurrency(item.valor_unitario)}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatCurrency(item.quantidade * item.valor_unitario)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <p className="font-semibold text-lg">Total do Pedido</p>
            <p className="font-bold text-xl text-green-700">
              {formatCurrency(nf.pedido.valor_total)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recebimento (se houver) */}
      {nf.recebimento && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {nf.recebimento.status === 'COMPLETO' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Recebimento
            </CardTitle>
            <CardDescription>
              Status: {nf.recebimento.status} -{' '}
              {formatDate(nf.recebimento.criado_em)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nf.recebimento.itens_recebimento?.map(
                (item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center p-3 border rounded-lg ${
                      item.divergencia ? 'border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        Pedido: {item.quantidade_pedida} | Recebido:{' '}
                        {item.quantidade_recebida}
                      </p>
                    </div>
                    {item.divergencia && (
                      <Badge variant="outline" className="bg-red-100 text-red-700">
                        Divergência
                      </Badge>
                    )}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <div className="w-0.5 h-full bg-gray-200" />
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">NF-e Registrada</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(nf.criado_em)}
                </p>
              </div>
            </div>

            {nf.recebimento && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <div className="w-0.5 h-full bg-gray-200" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Mercadoria Recebida</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {nf.recebimento.status}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(nf.recebimento.criado_em)}
                  </p>
                </div>
              </div>
            )}

            {nf.status !== 'PENDENTE' && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      nf.status === 'APROVADA'
                        ? 'bg-green-600'
                        : nf.status === 'DIVERGENTE'
                          ? 'bg-red-600'
                          : 'bg-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {nf.status === 'APROVADA'
                      ? 'NF-e Aprovada'
                      : nf.status === 'CONFERIDA'
                        ? 'NF-e Conferida'
                        : nf.status === 'DIVERGENTE'
                          ? 'Divergências Identificadas'
                          : 'NF-e Devolvida'}
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
