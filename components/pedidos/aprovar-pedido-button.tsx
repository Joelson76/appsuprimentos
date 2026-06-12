'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AprovarPedidoButtonProps {
  pedidoId: string
  numero: string
}

export function AprovarPedidoButton({
  pedidoId,
  numero,
}: AprovarPedidoButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAprovar = async () => {
    if (
      !confirm(
        `Tem certeza que deseja aprovar o pedido ${numero}?\n\nApós a aprovação, o pedido poderá ser enviado ao fornecedor.`
      )
    ) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'APROVADO',
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', pedidoId)

      if (error) throw error

      alert(`Pedido ${numero} aprovado com sucesso!`)
      router.refresh()
    } catch (error) {
      console.error('Erro ao aprovar pedido:', error)
      alert('Erro ao aprovar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleAprovar} disabled={loading} size="sm">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="mr-2 h-4 w-4" />
      )}
      Aprovar
    </Button>
  )
}
