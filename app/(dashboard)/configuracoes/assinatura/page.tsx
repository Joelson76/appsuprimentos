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

  // Buscar pagamentos
  const { data: pagamentos } = await supabase
    .from('pagamentos')
    .select('*')
    .eq('assinatura_id', assinatura?.id || '')
    .order('criado_em', { ascending: false })
    .limit(10)

  // Mapeamento de planos (nome e preço baseado no enum)
  const planosMap: Record<string, { nome: string; preco_centavos: number }> = {
    BASICO: { nome: 'Básico', preco_centavos: 14900 },
    PROFISSIONAL: { nome: 'Profissional', preco_centavos: 29700 },
    ENTERPRISE: { nome: 'Enterprise', preco_centavos: 99700 }
  }

  const planoAtual = assinatura?.plano ? planosMap[assinatura.plano] : planosMap.BASICO

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      PAGO: 'bg-green-100 text-green-800',
      VENCIDO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-slate-100 text-slate-800',
      ESTORNADO: 'bg-slate-100 text-slate-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status}
      </Badge>
    )
  }

  const getStatusAssinaturaBadge = (status: string) => {
    const colors: Record<string, string> = {
      TRIAL: 'bg-blue-100 text-blue-800',
      ATIVA: 'bg-green-100 text-green-800',
      INADIMPLENTE: 'bg-orange-100 text-orange-800',
      SUSPENSA: 'bg-red-100 text-red-800',
      CANCELADA: 'bg-slate-100 text-slate-800',
    }
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>
        {status}
      </Badge>
    )
  }

  // Próximo vencimento
  const proximoPagamento = pagamentos?.find((p) => p.status === 'PENDENTE')

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
                {planoAtual?.nome || 'Básico'}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Valor Mensal</p>
              <p className="text-2xl font-bold">
                {formatCurrency((planoAtual?.preco_centavos || 0) / 100)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={assinatura?.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {assinatura?.ativa ? 'ATIVA' : 'INATIVA'}
              </Badge>
            </div>

            {!assinatura?.ativa && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-900">
                  Pagamento pendente
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Regularize sua situação para continuar usando o sistema
                </p>
              </div>
            )}

            <div className="pt-4 space-y-2">
              <Link href="/configuracoes/planos">
                <Button className="w-full" variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Ver Outros Planos
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
            {proximoPagamento ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="text-2xl font-bold">
                    {formatDate(proximoPagamento.vencimento)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(proximoPagamento.valor)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(proximoPagamento.status)}
                </div>

                {proximoPagamento.link_pagamento && (
                  <div className="pt-4">
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => window.open(proximoPagamento.link_pagamento, '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Ver Pagamento
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Nenhum pagamento pendente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recursos do Plano */}
      {planoAtual?.funcionalidades && (
        <Card>
          <CardHeader>
            <CardTitle>Recursos Inclusos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3">
              {planoAtual.funcionalidades.map((recurso: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="capitalize">{recurso.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            {pagamentos?.length || 0} pagamento(s) registrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pago em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentos && pagamentos.length > 0 ? (
                pagamentos.map((pagamento) => (
                  <TableRow key={pagamento.id}>
                    <TableCell>{formatDate(pagamento.vencimento)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(pagamento.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {pagamento.metodo_pagamento || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(pagamento.status)}</TableCell>
                    <TableCell>
                      {pagamento.pago_em ? formatDate(pagamento.pago_em) : '-'}
                    </TableCell>
                    <TableCell>
                      {pagamento.link_pagamento && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            window.open(pagamento.link_pagamento, '_blank')
                          }
                        >
                          Ver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhum pagamento registrado
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
