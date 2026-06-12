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
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Download,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { GerarCobrancaButton } from '@/components/billing/gerar-cobranca-button'
import { MarcarPagaButton } from '@/components/billing/marcar-paga-button'
import { CancelarFaturaButton } from '@/components/billing/cancelar-fatura-button'

export default async function FaturaDetalhesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: fatura, error } = await supabase
    .from('faturas')
    .select(
      `
      *,
      tenant:tenants!faturas_tenant_id_fkey (
        id,
        nome,
        cnpj,
        email,
        telefone,
        status
      ),
      assinatura:assinaturas!faturas_assinatura_id_fkey (
        id,
        plano,
        valor_mensal,
        forma_pagamento
      )
    `
    )
    .eq('id', params.id)
    .single()

  if (error || !fatura) {
    return notFound()
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      PAGO: 'bg-green-100 text-green-800',
      VENCIDO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-slate-100 text-slate-800',
      ESTORNADO: 'bg-orange-100 text-orange-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status}
      </Badge>
    )
  }

  const diasVencimento = Math.ceil(
    (new Date(fatura.vencimento).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/cobrancas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Fatura {fatura.numero}</h1>
            <p className="text-muted-foreground mt-1">
              {fatura.tenant.nome}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(fatura.status)}
          {fatura.status === 'PENDENTE' && !fatura.asaas_payment_id && (
            <GerarCobrancaButton faturaId={fatura.id} />
          )}
          {fatura.status === 'PENDENTE' && (
            <MarcarPagaButton faturaId={fatura.id} />
          )}
          {fatura.status === 'PENDENTE' && (
            <CancelarFaturaButton faturaId={fatura.id} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações da Fatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes da Fatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Número</p>
              <p className="font-mono font-semibold text-lg">{fatura.numero}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-3xl font-bold text-green-700">
                {formatCurrency(fatura.valor)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vencimento</p>
                <p className="font-semibold">{formatDate(fatura.vencimento)}</p>
                {diasVencimento < 0 && fatura.status === 'PENDENTE' && (
                  <Badge variant="outline" className="mt-1 bg-red-50 text-red-700">
                    Vencido há {Math.abs(diasVencimento)} dias
                  </Badge>
                )}
                {diasVencimento >= 0 && diasVencimento <= 7 && fatura.status === 'PENDENTE' && (
                  <Badge variant="outline" className="mt-1 bg-yellow-50 text-yellow-700">
                    Vence em {diasVencimento} dias
                  </Badge>
                )}
              </div>

              {fatura.pagamento_em && (
                <div>
                  <p className="text-sm text-muted-foreground">Pagamento</p>
                  <p className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {formatDate(fatura.pagamento_em)}
                  </p>
                </div>
              )}
            </div>

            {fatura.descricao && (
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p>{fatura.descricao}</p>
              </div>
            )}

            {fatura.observacoes && (
              <div>
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="text-sm">{fatura.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Empresa</p>
              <p className="font-semibold text-lg">{fatura.tenant.nome}</p>
            </div>

            {fatura.tenant.cnpj && (
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-mono">{fatura.tenant.cnpj}</p>
              </div>
            )}

            {fatura.tenant.email && (
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p>{fatura.tenant.email}</p>
              </div>
            )}

            {fatura.tenant.telefone && (
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p>{fatura.tenant.telefone}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Status do Tenant</p>
              <Badge
                className={
                  fatura.tenant.status === 'ATIVO'
                    ? 'bg-green-100 text-green-800'
                    : fatura.tenant.status === 'BLOQUEADO'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                }
              >
                {fatura.tenant.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações da Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Plano</p>
            <p className="font-semibold text-lg">{fatura.assinatura.plano}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Valor Mensal</p>
            <p className="font-semibold text-lg">
              {formatCurrency(fatura.assinatura.valor_mensal)}
            </p>
          </div>

          {fatura.assinatura.forma_pagamento && (
            <div>
              <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
              <p className="font-semibold">
                {fatura.assinatura.forma_pagamento.replace('_', ' ')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integração Asaas */}
      {fatura.asaas_payment_id && (
        <Card>
          <CardHeader>
            <CardTitle>Integração Asaas</CardTitle>
            <CardDescription>
              Cobrança gerada via gateway de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Payment ID</p>
              <p className="font-mono text-sm">{fatura.asaas_payment_id}</p>
            </div>

            {fatura.asaas_invoice_url && (
              <div>
                <Link href={fatura.asaas_invoice_url} target="_blank">
                  <Button variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver no Asaas
                  </Button>
                </Link>
              </div>
            )}

            {fatura.linha_digitavel && (
              <div>
                <p className="text-sm text-muted-foreground">Linha Digitável</p>
                <p className="font-mono text-sm bg-slate-50 p-2 rounded">
                  {fatura.linha_digitavel}
                </p>
                <Button variant="outline" className="mt-2">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Boleto
                </Button>
              </div>
            )}

            {fatura.qr_code_pix && (
              <div>
                <p className="text-sm text-muted-foreground">PIX Copia e Cola</p>
                <p className="font-mono text-xs bg-slate-50 p-2 rounded break-all">
                  {fatura.qr_code_pix}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <div className="w-0.5 h-full bg-gray-200" />
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">Fatura Criada</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(fatura.criado_em)}
                </p>
              </div>
            </div>

            {fatura.asaas_payment_id && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-600" />
                  {fatura.pagamento_em && <div className="w-0.5 h-full bg-gray-200" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Cobrança Gerada no Asaas</p>
                  <p className="text-sm text-muted-foreground">
                    ID: {fatura.asaas_payment_id}
                  </p>
                </div>
              </div>
            )}

            {fatura.pagamento_em && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Pagamento Confirmado</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(fatura.pagamento_em)}
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
