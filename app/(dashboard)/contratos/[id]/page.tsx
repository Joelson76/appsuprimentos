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
  FileText,
  AlertTriangle,
  Calendar,
  Building2,
  DollarSign,
  Clock,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { RenovarContratoButton } from '@/components/contratos/renovar-contrato-button'
import { CancelarContratoButton } from '@/components/contratos/cancelar-contrato-button'
import { DownloadDocumentoButton } from '@/components/contratos/download-documento-button'

export default async function ContratoDetalhesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: contrato, error } = await supabase
    .from('contratos')
    .select(
      `
      *,
      fornecedor:fornecedores (
        id,
        razao_social,
        nome_fantasia,
        cnpj,
        email,
        telefone,
        endereco
      )
    `
    )
    .eq('id', params.id)
    .single()

  if (error || !contrato) {
    return notFound()
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ATIVO: 'bg-green-100 text-green-800',
      VENCENDO: 'bg-yellow-100 text-yellow-800',
      VENCIDO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-slate-100 text-slate-800',
      EM_RENOVACAO: 'bg-blue-100 text-blue-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getDiasRestantes = () => {
    const hoje = new Date()
    const fim = new Date(contrato.fim)
    const diffTime = fim.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDuracao = () => {
    const inicio = new Date(contrato.inicio)
    const fim = new Date(contrato.fim)
    const diffTime = fim.getTime() - inicio.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const meses = Math.floor(diffDays / 30)
    const anos = Math.floor(meses / 12)

    if (anos > 0) {
      return `${anos} ano(s) e ${meses % 12} mês(es)`
    }
    return `${meses} mês(es)`
  }

  const diasRestantes = getDiasRestantes()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contratos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{contrato.titulo}</h1>
            {contrato.numero && (
              <p className="text-muted-foreground mt-1">
                Contrato Nº {contrato.numero}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(contrato.status)}
          {contrato.status === 'ATIVO' && (
            <>
              <RenovarContratoButton contratoId={contrato.id} />
              <CancelarContratoButton contratoId={contrato.id} />
            </>
          )}
        </div>
      </div>

      {/* Alerta de Vencimento */}
      {contrato.status === 'ATIVO' && diasRestantes <= contrato.alerta_dias && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Contrato Próximo do Vencimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-800">
              {diasRestantes > 0
                ? `Restam apenas ${diasRestantes} dias até o vencimento deste contrato.`
                : `Este contrato venceu há ${Math.abs(diasRestantes)} dias.`}
            </p>
            {contrato.renovacao_auto && (
              <p className="text-sm text-yellow-700 mt-2">
                ✓ Renovação automática ativada
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Título</p>
              <p className="font-semibold">{contrato.titulo}</p>
            </div>

            {contrato.numero && (
              <div>
                <p className="text-sm text-muted-foreground">Número</p>
                <p className="font-mono font-semibold">{contrato.numero}</p>
              </div>
            )}

            {contrato.valor_total && (
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(contrato.valor_total)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data de Início</p>
                <p className="font-semibold">{formatDate(contrato.inicio)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Término</p>
                <p className="font-semibold">{formatDate(contrato.fim)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Duração</p>
              <p className="font-semibold">{getDuracao()}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Tempo Restante</p>
              <p
                className={`font-bold ${
                  diasRestantes < 0
                    ? 'text-red-600'
                    : diasRestantes <= 30
                      ? 'text-yellow-600'
                      : 'text-green-600'
                }`}
              >
                {diasRestantes < 0
                  ? `Vencido há ${Math.abs(diasRestantes)} dias`
                  : `${diasRestantes} dias restantes`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  contrato.renovacao_auto ? 'bg-green-500' : 'bg-slate-300'
                }`}
              />
              <p className="text-sm">
                {contrato.renovacao_auto
                  ? 'Renovação automática ativada'
                  : 'Renovação manual'}
              </p>
            </div>

            {contrato.arquivo_path && (
              <DownloadDocumentoButton
                arquivoPath={contrato.arquivo_path}
                nomeContrato={contrato.titulo}
              />
            )}
          </CardContent>
        </Card>

        {/* Fornecedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Razão Social</p>
              <Link href={`/fornecedores/${contrato.fornecedor.id}`}>
                <p className="font-semibold text-primary hover:underline">
                  {contrato.fornecedor.razao_social}
                </p>
              </Link>
            </div>

            {contrato.fornecedor.nome_fantasia && (
              <div>
                <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                <p className="font-medium">
                  {contrato.fornecedor.nome_fantasia}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-mono">{contrato.fornecedor.cnpj}</p>
            </div>

            {contrato.fornecedor.email && (
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{contrato.fornecedor.email}</p>
              </div>
            )}

            {contrato.fornecedor.telefone && (
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{contrato.fornecedor.telefone}</p>
              </div>
            )}

            {contrato.fornecedor.endereco && (
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="text-sm">{contrato.fornecedor.endereco}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      {contrato.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{contrato.observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Configurações de Alerta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurações de Alerta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Alerta de vencimento
              </p>
              <p className="font-semibold">
                {contrato.alerta_dias} dias antes
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Você será notificado em{' '}
              {formatDate(
                new Date(
                  new Date(contrato.fim).getTime() -
                    contrato.alerta_dias * 24 * 60 * 60 * 1000
                )
              )}
            </p>
          </div>
        </CardContent>
      </Card>

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
                <p className="font-medium">Contrato Criado</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(contrato.criado_em)}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <div className="w-0.5 h-full bg-gray-200" />
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">Vigência Iniciada</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(contrato.inicio)}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-2 h-2 rounded-full ${
                    diasRestantes < 0 ? 'bg-red-600' : 'bg-yellow-600'
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {diasRestantes < 0 ? 'Vencido' : 'Término Previsto'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(contrato.fim)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
