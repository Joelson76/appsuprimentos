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
import {
  CreditCard,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Download,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function AssinaturaPage() {
  const supabase = await createClient()

  // Buscar tenant do usuário logado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  // Buscar assinatura
  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('tenant_id', profile?.tenant_id || '')
    .single()

  // Buscar tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', profile?.tenant_id || '')
    .single()

  // Buscar faturas
  const { data: faturas } = await supabase
    .from('faturas')
    .select('*')
    .eq('tenant_id', profile?.tenant_id || '')
    .order('criado_em', { ascending: false })
    .limit(10)

  // Buscar informações do plano
  const { data: planoInfo } = await supabase
    .from('planos_precos')
    .select('*')
    .eq('plano', assinatura?.plano || tenant?.plano || 'BASICO')
    .single()

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      PAGO: 'bg-green-100 text-green-800',
      VENCIDO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-slate-100 text-slate-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status}
      </Badge>
    )
  }

  // Próximo vencimento
  const proximaFatura = faturas?.find((f) => f.status === 'PENDENTE')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minha Assinatura</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu plano e pagamentos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plano Atual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plano Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Plano</p>
              <p className="text-3xl font-bold text-primary">
                {planoInfo?.nome || tenant?.plano}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Valor Mensal</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  assinatura?.valor_mensal || planoInfo?.valor_mensal || 0
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                className={
                  tenant?.status === 'ATIVO'
                    ? 'bg-green-100 text-green-800'
                    : tenant?.status === 'TRIAL'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                }
              >
                {tenant?.status}
              </Badge>
            </div>

            {tenant?.status === 'TRIAL' && tenant?.trial_fim && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  Trial ativo até {formatDate(tenant.trial_fim)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Após este período, será necessário assinar um plano
                </p>
              </div>
            )}

            <div className="pt-4">
              <Link href="/configuracoes/planos">
                <Button className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Alterar Plano
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Próximo Vencimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximo Vencimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {proximaFatura ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="text-2xl font-bold">
                    {formatDate(proximaFatura.vencimento)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(proximaFatura.valor)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-mono">{proximaFatura.numero}</p>
                </div>

                {proximaFatura.linha_digitavel && (
                  <div className="pt-4">
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Boleto
                    </Button>
                  </div>
                )}

                {proximaFatura.qr_code_pix && (
                  <div>
                    <Button variant="default" className="w-full">
                      Ver QR Code PIX
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Nenhuma fatura pendente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recursos do Plano */}
      {planoInfo?.recursos && (
        <Card>
          <CardHeader>
            <CardTitle>Recursos Inclusos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3">
              {(planoInfo.recursos as string[]).map((recurso, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{recurso}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
          <CardDescription>
            {faturas?.length || 0} fatura(s) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faturas && faturas.length > 0 ? (
                faturas.map((fatura) => (
                  <TableRow key={fatura.id}>
                    <TableCell className="font-mono">
                      {fatura.numero}
                    </TableCell>
                    <TableCell>{fatura.descricao || '-'}</TableCell>
                    <TableCell>{formatDate(fatura.vencimento)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(fatura.valor)}
                    </TableCell>
                    <TableCell>{getStatusBadge(fatura.status)}</TableCell>
                    <TableCell>
                      {fatura.pagamento_em
                        ? formatDate(fatura.pagamento_em)
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhuma fatura registrada
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
