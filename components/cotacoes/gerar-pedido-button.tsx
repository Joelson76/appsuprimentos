'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ShoppingCart, AlertTriangle } from 'lucide-react'

interface GerarPedidoButtonProps {
  cotacaoId: string
  itensVencedores: any[]
}

export default function GerarPedidoButton({
  cotacaoId,
  itensVencedores,
}: GerarPedidoButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Agrupar por fornecedor
  const itensPorFornecedor = itensVencedores.reduce((acc: any, item) => {
    if (!acc[item.fornecedor_id]) {
      acc[item.fornecedor_id] = {
        fornecedor: item.fornecedor,
        itens: [],
        total: 0,
      }
    }
    acc[item.fornecedor_id].itens.push(item)
    acc[item.fornecedor_id].total +=
      (item.valor_unitario || 0) * item.quantidade
    return acc
  }, {})

  const handleGerarPedidos = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não autenticado')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setError('Profile não encontrado')
        return
      }

      const pedidosCriados = []

      // Criar um pedido para cada fornecedor
      for (const [fornecedorId, data] of Object.entries(
        itensPorFornecedor as any
      )) {
        const { data: pedido, error: pedidoError } = await supabase
          .from('pedidos')
          .insert({
            tenant_id: profile.tenant_id,
            cotacao_id: cotacaoId,
            fornecedor_id: fornecedorId,
            valor_total: data.total,
            condicao_pagamento: data.itens[0]?.condicao_pagamento,
            observacoes: data.itens[0]?.observacoes,
            criado_por: user.id,
            status: 'PENDENTE',
          })
          .select()
          .single()

        if (pedidoError) {
          throw pedidoError
        }

        // Criar itens do pedido
        const itensPedido = data.itens.map((item: any) => ({
          pedido_id: pedido.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          prazo_entrega: item.prazo_entrega,
          observacoes: item.observacoes,
        }))

        const { error: itensError } = await supabase
          .from('itens_pedido')
          .insert(itensPedido)

        if (itensError) {
          throw itensError
        }

        pedidosCriados.push(pedido)
      }

      // Atualizar status da cotação
      await supabase
        .from('cotacoes')
        .update({ status: 'ENCERRADA' })
        .eq('id', cotacaoId)

      // Se gerou apenas 1 pedido, redirecionar para ele
      // Se gerou vários, redirecionar para a lista
      if (pedidosCriados.length === 1) {
        router.push(`/pedidos/${pedidosCriados[0].id}`)
      } else {
        router.push('/pedidos')
      }
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao gerar pedidos:', err)
      setError(err.message || 'Erro ao gerar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const totalGeral = Object.values(itensPorFornecedor).reduce(
    (sum: number, data: any) => sum + data.total,
    0
  )

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg" className="gap-2">
        <ShoppingCart className="h-5 w-5" />
        Gerar Pedido(s) de Compra
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Gerar Pedidos de Compra
            </DialogTitle>
            <DialogDescription>
              Criar pedido(s) com os itens vencedores selecionados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold">Resumo dos Pedidos:</h4>
              {Object.entries(itensPorFornecedor).map(
                ([fornecedorId, data]: [string, any]) => (
                  <div
                    key={fornecedorId}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {data.fornecedor?.nome_fantasia ||
                        data.fornecedor?.razao_social}{' '}
                      ({data.itens.length} {data.itens.length === 1 ? 'item' : 'itens'})
                    </span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(data.total)}
                    </span>
                  </div>
                )
              )}
              <div className="flex justify-between pt-3 border-t font-bold">
                <span>Total Geral:</span>
                <span className="text-lg text-primary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalGeral)}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm text-blue-900">
                  <p className="font-medium">Ao confirmar, o sistema irá:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      Gerar{' '}
                      {Object.keys(itensPorFornecedor).length === 1
                        ? '1 Pedido de Compra'
                        : `${Object.keys(itensPorFornecedor).length} Pedidos de Compra`}
                    </li>
                    <li>Encerrar a cotação</li>
                    <li>Status dos pedidos: PENDENTE (aguardando aprovação)</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleGerarPedidos} disabled={loading}>
              {loading ? 'Gerando...' : 'Confirmar e Gerar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
