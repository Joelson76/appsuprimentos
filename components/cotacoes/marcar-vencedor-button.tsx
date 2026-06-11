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
import { Trophy, AlertTriangle } from 'lucide-react'

interface MarcarVencedorButtonProps {
  cotacaoId: string
  fornecedorId: string
  fornecedorNome: string
  valorTotal: number
  itens: any[]
}

export default function MarcarVencedorButton({
  cotacaoId,
  fornecedorId,
  fornecedorNome,
  valorTotal,
  itens,
}: MarcarVencedorButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleMarcarVencedor = async () => {
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

      // 1. Marcar todos os itens do fornecedor como vencedor
      const idsItensVencedores = itens.map((i) => i.id)

      const { error: updateError } = await supabase
        .from('itens_cotacao')
        .update({ vencedor: true })
        .in('id', idsItensVencedores)

      if (updateError) {
        throw updateError
      }

      // 2. Desmarcar outros fornecedores desta cotação
      await supabase
        .from('itens_cotacao')
        .update({ vencedor: false })
        .eq('cotacao_id', cotacaoId)
        .not('id', 'in', `(${idsItensVencedores.join(',')})`)

      // 3. Criar o pedido de compra
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          tenant_id: profile.tenant_id,
          cotacao_id: cotacaoId,
          fornecedor_id: fornecedorId,
          valor_total: valorTotal,
          condicao_pagamento: itens[0]?.condicao_pagamento,
          observacoes: itens[0]?.observacoes,
          criado_por: user.id,
          status: 'PENDENTE',
        })
        .select()
        .single()

      if (pedidoError) {
        throw pedidoError
      }

      // 4. Criar itens do pedido
      const itensPedido = itens.map((item) => ({
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

      // 5. Atualizar status da cotação
      await supabase
        .from('cotacoes')
        .update({ status: 'ENCERRADA' })
        .eq('id', cotacaoId)

      // Redirecionar para o pedido criado
      router.push(`/pedidos/${pedido.id}`)
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao gerar pedido:', err)
      setError(err.message || 'Erro ao gerar pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="default"
        size="sm"
        className="gap-2"
      >
        <Trophy className="h-4 w-4" />
        Marcar como Vencedor
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Confirmar Fornecedor Vencedor
            </DialogTitle>
            <DialogDescription>
              Esta ação irá gerar automaticamente um Pedido de Compra
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-yellow-900">
                    Ao confirmar, o sistema irá:
                  </p>
                  <ul className="list-disc list-inside text-yellow-800 space-y-1 ml-2">
                    <li>Marcar <strong>{fornecedorNome}</strong> como vencedor</li>
                    <li>
                      Gerar Pedido de Compra no valor de{' '}
                      <strong>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(valorTotal)}
                      </strong>
                    </li>
                    <li>Encerrar a cotação</li>
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
            <Button onClick={handleMarcarVencedor} disabled={loading}>
              {loading ? 'Gerando...' : 'Confirmar e Gerar Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
