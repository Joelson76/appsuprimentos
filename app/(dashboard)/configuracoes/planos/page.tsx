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

  // Buscar planos disponíveis direto do Supabase
  const { data: planos } = await supabase
    .from('planos')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  // Buscar plano atual do usuário
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('plano')
    .eq('tenant_id', profile?.tenant_id || '')
    .single()

  // Mapear plano enum para slug do plano
  const planoAtualSlug = assinatura?.plano?.toLowerCase() || null

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
          const isAtual = planoAtualSlug === plano.slug
          const isPopular = plano.slug === 'profissional'

          return (
            <Card
              key={plano.id}
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
                <div className="pt-4">
                  <div className="text-4xl font-bold">
                    {plano.preco_centavos === 0
                      ? 'Sob consulta'
                      : formatCurrency(plano.preco_centavos / 100)}
                  </div>
                  {plano.preco_centavos > 0 && (
                    <p className="text-sm text-muted-foreground">por mês</p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Limites */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Usuários:</span>
                    <span className="font-medium">
                      {plano.limite_usuarios === -1 ? 'Ilimitado' : plano.limite_usuarios}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pedidos/mês:</span>
                    <span className="font-medium">
                      {plano.limite_pos_mes === -1 ? 'Ilimitado' : plano.limite_pos_mes}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Storage:</span>
                    <span className="font-medium">
                      {plano.limite_storage_mb === -1 ? 'Ilimitado' : `${plano.limite_storage_mb} MB`}
                    </span>
                  </div>
                </div>

                {/* Recursos */}
                <ul className="space-y-2 pt-2">
                  {(plano.funcionalidades as string[]).slice(0, 5).map(
                    (recurso: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm capitalize">
                          {recurso.replace(/_/g, ' ')}
                        </span>
                      </li>
                    )
                  )}
                  {(plano.funcionalidades as string[]).length > 5 && (
                    <li className="text-sm text-muted-foreground">
                      + {(plano.funcionalidades as string[]).length - 5} recursos
                    </li>
                  )}
                </ul>

                {/* Botão */}
                <div className="pt-4">
                  {isAtual ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano Atual
                    </Button>
                  ) : plano.slug === 'enterprise' ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a href="mailto:contato@supriflow.com.br">
                        Falar com Vendas
                      </a>
                    </Button>
                  ) : (
                    <SelecionarPlanoButton
                      planoId={plano.id}
                      nomePlano={plano.nome}
                      planoAtual={planoAtualSlug}
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
