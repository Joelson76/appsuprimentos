'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Truck, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Item {
  id: string
  descricao: string
  quantidade: number
  quantidade_recebida: number
  valor_unitario: number
}

interface ConfirmarRecebimentoButtonProps {
  pedidoId: string
  numero: string
  itens: Item[]
}

export function ConfirmarRecebimentoButton({
  pedidoId,
  numero,
  itens,
}: ConfirmarRecebimentoButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quantidades, setQuantidades] = useState<Record<string, number>>(() => {
    // Inicializar com a quantidade pendente de cada item
    const inicial: Record<string, number> = {}
    itens.forEach((item) => {
      inicial[item.id] = Number(item.quantidade) - Number(item.quantidade_recebida)
    })
    return inicial
  })

  const router = useRouter()
  const supabase = createClient()

  const handleQuantidadeChange = (itemId: string, value: string) => {
    const num = parseFloat(value) || 0
    setQuantidades((prev) => ({
      ...prev,
      [itemId]: num,
    }))
  }

  const handleConfirmar = async () => {
    setLoading(true)

    try {
      // Atualizar cada item
      const updates = itens.map((item) => {
        const qtdRecebendo = quantidades[item.id] || 0
        const novaQtdRecebida =
          Number(item.quantidade_recebida) + qtdRecebendo

        return supabase
          .from('itens_pedido')
          .update({
            quantidade_recebida: novaQtdRecebida,
          })
          .eq('id', item.id)
      })

      const results = await Promise.all(updates)

      // Verificar se houve erro em alguma atualização
      const erros = results.filter((r) => r.error)
      if (erros.length > 0) {
        throw new Error('Erro ao atualizar itens')
      }

      // Calcular novo status do pedido
      let todosRecebidos = true
      let algumRecebido = false

      itens.forEach((item) => {
        const qtdRecebendo = quantidades[item.id] || 0
        const novaQtdRecebida =
          Number(item.quantidade_recebida) + qtdRecebendo

        if (novaQtdRecebida < Number(item.quantidade)) {
          todosRecebidos = false
        }
        if (novaQtdRecebida > 0) {
          algumRecebido = true
        }
      })

      // Atualizar status do pedido
      let novoStatus = 'ENVIADO'
      if (todosRecebidos) {
        novoStatus = 'RECEBIDO'
      } else if (algumRecebido) {
        novoStatus = 'PARCIALMENTE_RECEBIDO'
      }

      const { error: pedidoError } = await supabase
        .from('pedidos')
        .update({
          status: novoStatus,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', pedidoId)

      if (pedidoError) throw pedidoError

      alert(
        `Recebimento registrado com sucesso!\n\nStatus: ${novoStatus.replace(
          '_',
          ' '
        )}`
      )
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error)
      alert('Erro ao registrar recebimento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const totalPendente = itens.reduce(
    (acc, item) =>
      acc + (Number(item.quantidade) - Number(item.quantidade_recebida)),
    0
  )

  const totalRecebendo = Object.values(quantidades).reduce(
    (acc, qtd) => acc + qtd,
    0
  )

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        <Truck className="mr-2 h-4 w-4" />
        Confirmar Recebimento
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento - {numero}</DialogTitle>
            <DialogDescription>
              Informe as quantidades recebidas de cada item. Você pode fazer
              recebimentos parciais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {itens.map((item) => {
              const qtdPedida = Number(item.quantidade)
              const qtdJaRecebida = Number(item.quantidade_recebida)
              const qtdPendente = qtdPedida - qtdJaRecebida
              const qtdRecebendo = quantidades[item.id] || 0
              const percentualTotal =
                ((qtdJaRecebida + qtdRecebendo) / qtdPedida) * 100

              return (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 space-y-3 bg-muted/30"
                >
                  <div>
                    <h4 className="font-medium">{item.descricao}</h4>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-muted-foreground">
                      <div>
                        <span className="block text-xs">Pedida</span>
                        <span className="font-semibold text-foreground">
                          {qtdPedida.toLocaleString('pt-BR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 3,
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs">Já Recebida</span>
                        <span className="font-semibold text-foreground">
                          {qtdJaRecebida.toLocaleString('pt-BR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 3,
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs">Pendente</span>
                        <span className="font-semibold text-orange-600">
                          {qtdPendente.toLocaleString('pt-BR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 3,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`qtd-${item.id}`}>
                      Quantidade Recebendo Agora
                    </Label>
                    <Input
                      id={`qtd-${item.id}`}
                      type="number"
                      min="0"
                      max={qtdPendente}
                      step="0.001"
                      value={qtdRecebendo}
                      onChange={(e) =>
                        handleQuantidadeChange(item.id, e.target.value)
                      }
                      disabled={qtdPendente <= 0}
                    />
                    {qtdRecebendo > qtdPendente && (
                      <p className="text-sm text-red-600">
                        ⚠️ Quantidade maior que o pendente
                      </p>
                    )}
                    {qtdRecebendo > 0 && (
                      <p className="text-sm text-green-600">
                        <CheckCircle className="inline h-3 w-3 mr-1" />
                        Total após este recebimento:{' '}
                        {(qtdJaRecebida + qtdRecebendo).toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 3,
                          }
                        )}{' '}
                        ({percentualTotal.toFixed(0)}%)
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Resumo</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total Pendente:</span>
                  <p className="font-bold text-blue-900">
                    {totalPendente.toLocaleString('pt-BR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 3,
                    })}{' '}
                    itens
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Total Recebendo:</span>
                  <p className="font-bold text-blue-900">
                    {totalRecebendo.toLocaleString('pt-BR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 3,
                    })}{' '}
                    itens
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmar} disabled={loading || totalRecebendo === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Recebimento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
