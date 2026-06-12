'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CancelarPedidoButtonProps {
  pedidoId: string
  numero: string
}

export function CancelarPedidoButton({
  pedidoId,
  numero,
}: CancelarPedidoButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCancelar = async () => {
    const motivo = prompt(
      `Cancelar pedido ${numero}\n\nDigite o motivo do cancelamento:`
    )

    if (!motivo || motivo.trim() === '') {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'CANCELADO',
          observacoes: `[CANCELADO] ${motivo}\n\n${
            (await supabase
              .from('pedidos')
              .select('observacoes')
              .eq('id', pedidoId)
              .single()
              .then((res) => res.data?.observacoes || ''))
          }`,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', pedidoId)

      if (error) throw error

      alert(`Pedido ${numero} cancelado.`)
      router.refresh()
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      alert('Erro ao cancelar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCancelar}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <XCircle className="mr-2 h-4 w-4" />
      )}
      Cancelar
    </Button>
  )
}
