import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { SelecionarPlanoButton } from '@/components/billing/selecionar-plano-button'

export default async function PlanosPage() {
  const supabase = await createClient()

  // Buscar planos disponíveis
  const { data: planos } = await supabase
    .from('planos_precos')
    .select('*')
    .order('valor_mensal')

  // Buscar plano atual do usuário
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('plano')
    .eq('id', profile?.tenant_id || '')
    .single()

  const planoAtual = tenant?.plano

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Escolha seu Plano</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Selecione o plano ideal para sua empresa
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        {planos?.map((plano: any) => {
          const isAtual = planoAtual === plano.plano
          const isPopular = plano.plano === 'PROFISSIONAL'

          return (
            <Card
              key={plano.plano}
              className={`relative ${
                isPopular
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-slate-200'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              {isAtual && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-100 text-green-800">
                    Plano Atual
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plano.nome}</CardTitle>
                <CardDescription>{plano.descricao}</CardDescription>
                <div className="pt-4">
                  <div className="text-4xl font-bold">
                    {formatCurrency(plano.valor_mensal)}
                  </div>
                  <p className="text-sm text-muted-foreground">por mês</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Recursos */}
                <ul className="space-y-2">
                  {(plano.recursos as string[]).map(
                    (recurso: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{recurso}</span>
                      </li>
                    )
                  )}
                </ul>

                {/* Botão */}
                <div className="pt-4">
                  {isAtual ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano Atual
                    </Button>
                  ) : (
                    <SelecionarPlanoButton
                      plano={plano.plano}
                      nomePlano={plano.nome}
                      valor={plano.valor_mensal}
                      planoAtual={planoAtual}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Garantia */}
      <div className="text-center max-w-2xl mx-auto pt-8">
        <Card className="bg-slate-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Garantia de 7 dias</h3>
            <p className="text-sm text-muted-foreground">
              Experimente sem riscos. Se não ficar satisfeito, devolvemos seu
              dinheiro em até 7 dias.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Badge({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${className}`}
    >
      {children}
    </span>
  )
}
