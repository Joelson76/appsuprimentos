'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CreditCard, Barcode, QrCode, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Plano {
  id: string
  nome: string
  preco_centavos: number
  limite_usuarios: number
  limite_pos_mes: number
  funcionalidades: string[]
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planoId = searchParams.get('plano')

  const [plano, setPlano] = useState<Plano | null>(null)
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX')
  const [loading, setLoading] = useState(false)
  const [pagamentoGerado, setPagamentoGerado] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!planoId) {
      toast.error('Plano não informado')
      router.push('/configuracoes/assinatura')
      return
    }

    carregarPlano()
  }, [planoId])

  async function carregarPlano() {
    const { data, error } = await supabase
      .from('planos')
      .select('*')
      .eq('id', planoId)
      .single()

    if (error || !data) {
      toast.error('Plano não encontrado')
      router.push('/configuracoes/assinatura')
      return
    }

    setPlano(data)
  }

  async function handleCheckout() {
    setLoading(true)

    try {
      const response = await fetch('/api/assinatura/criar-cobranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planoId: plano!.id,
          metodoPagamento,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar cobrança')
      }

      setPagamentoGerado(result)
      toast.success('Cobrança gerada com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  if (!plano) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (pagamentoGerado) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>Pagamento Gerado!</CardTitle>
            </div>
            <CardDescription>
              Complete o pagamento para ativar sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {metodoPagamento === 'PIX' && pagamentoGerado.pix && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Image
                    src={`data:image/png;base64,${pagamentoGerado.pix.encodedImage}`}
                    alt="QR Code PIX"
                    width={250}
                    height={250}
                  />
                </div>
                <div className="space-y-2">
                  <Label>PIX Copia e Cola</Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pagamentoGerado.pix.payload}
                      readOnly
                      className="flex-1 p-2 border rounded text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(pagamentoGerado.pix.payload)
                        toast.success('Código PIX copiado!')
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {metodoPagamento === 'BOLETO' && pagamentoGerado.boleto && (
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() => window.open(pagamentoGerado.boleto.url, '_blank')}
                >
                  <Barcode className="mr-2 h-4 w-4" />
                  Abrir Boleto
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Clique acima para visualizar e imprimir o boleto bancário
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/configuracoes/assinatura')}
            >
              Voltar para Assinatura
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Finalizar Assinatura</CardTitle>
          <CardDescription>
            Escolha a forma de pagamento para ativar seu plano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumo do Plano */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{plano.nome}</span>
              <Badge>Mensal</Badge>
            </div>
            <div className="text-2xl font-bold">
              R$ {(plano.preco_centavos / 100).toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {plano.limite_usuarios === -1 ? 'Usuários ilimitados' : `Até ${plano.limite_usuarios} usuários`}</li>
              <li>• {plano.limite_pos_mes === -1 ? 'POs ilimitadas' : `${plano.limite_pos_mes} POs/mês`}</li>
            </ul>
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-3">
            <Label>Forma de Pagamento</Label>
            <RadioGroup
              value={metodoPagamento}
              onValueChange={(value: any) => setMetodoPagamento(value)}
            >
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="PIX" id="pix" />
                <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                  <QrCode className="h-5 w-5" />
                  <div>
                    <div className="font-medium">PIX</div>
                    <div className="text-sm text-muted-foreground">Aprovação imediata</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="BOLETO" id="boleto" />
                <Label htmlFor="boleto" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Barcode className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Boleto Bancário</div>
                    <div className="text-sm text-muted-foreground">Aprovação em até 2 dias úteis</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent opacity-50">
                <RadioGroupItem value="CREDIT_CARD" id="cartao" disabled />
                <Label htmlFor="cartao" className="flex items-center gap-2 cursor-not-allowed flex-1">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Cartão de Crédito</div>
                    <div className="text-sm text-muted-foreground">Em breve</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Botão Confirmar */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Assinatura'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao confirmar, você concorda com nossos Termos de Uso e Política de Privacidade.
            O pagamento será processado pelo Asaas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
