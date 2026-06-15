import { createClient } from '@supabase/supabase-js'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function PlanosPublicosPage() {
  // Buscar planos direto do Supabase (público)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: planos } = await supabase
    .from('planos')
    .select('*')
    .eq('ativo', true)
    .order('valor_mensal', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Escolha seu Plano</h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Selecione o plano ideal para sua empresa gerenciar compras e
              suprimentos com eficiência
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto mt-12">
            {planos?.map((plano: any) => {
              const isPopular = plano.slug === 'profissional'

              return (
                <Card
                  key={plano.id}
                  className={`relative ${
                    isPopular
                      ? 'border-primary shadow-2xl scale-105'
                      : 'border-slate-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-primary text-white px-4 py-1 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Mais Popular
                      </div>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl mb-4">
                      {plano.nome}
                    </CardTitle>
                    <div>
                      <div className="text-5xl font-bold">
                        {plano.preco_centavos === 0
                          ? 'Sob consulta'
                          : formatCurrency(plano.preco_centavos / 100)}
                      </div>
                      {plano.preco_centavos > 0 && (
                        <p className="text-muted-foreground mt-2">por mês</p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Limites */}
                    <div className="space-y-3 pb-4 border-b">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Usuários:
                        </span>
                        <span className="font-semibold">
                          {plano.limite_usuarios === -1
                            ? 'Ilimitado'
                            : plano.limite_usuarios}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">POs/mês:</span>
                        <span className="font-semibold">
                          {plano.limite_pos_mes === -1
                            ? 'Ilimitado'
                            : plano.limite_pos_mes}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Storage:</span>
                        <span className="font-semibold">
                          {plano.limite_storage_mb === -1
                            ? 'Ilimitado'
                            : `${plano.limite_storage_mb} MB`}
                        </span>
                      </div>
                    </div>

                    {/* Recursos */}
                    <ul className="space-y-3">
                      {(plano.funcionalidades as string[])
                        .slice(0, 6)
                        .map((recurso: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm capitalize">
                              {recurso.replace(/_/g, ' ')}
                            </span>
                          </li>
                        ))}
                      {(plano.funcionalidades as string[]).length > 6 && (
                        <li className="text-sm text-muted-foreground">
                          + {(plano.funcionalidades as string[]).length - 6}{' '}
                          recursos
                        </li>
                      )}
                    </ul>

                    {/* Botão */}
                    <div className="pt-4">
                      {plano.slug === 'enterprise' ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          size="lg"
                          asChild
                        >
                          <a href="mailto:contato@supriflow.com.br">
                            Falar com Vendas
                          </a>
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          size="lg"
                          variant={isPopular ? 'default' : 'outline'}
                          asChild
                        >
                          <Link href="/cadastro">Começar Agora</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Garantia */}
          <div className="text-center max-w-2xl mx-auto pt-12">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-lg">
                  ✓ Garantia de 7 dias
                </h3>
                <p className="text-sm text-muted-foreground">
                  Experimente sem riscos. Se não ficar satisfeito, devolvemos
                  seu dinheiro em até 7 dias.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center pt-8">
            <p className="text-muted-foreground mb-4">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary font-semibold">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
