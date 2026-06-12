'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface EnviarFornecedorButtonProps {
  pedidoId: string
  numero: string
  fornecedorEmail?: string
}

export function EnviarFornecedorButton({
  pedidoId,
  numero,
  fornecedorEmail,
}: EnviarFornecedorButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleEnviar = async () => {
    if (!fornecedorEmail) {
      alert(
        'Fornecedor não possui e-mail cadastrado. Atualize o cadastro do fornecedor primeiro.'
      )
      return
    }

    if (
      !confirm(
        `Enviar pedido ${numero} para o fornecedor?\n\nE-mail: ${fornecedorEmail}\n\nUm e-mail será enviado com os detalhes do pedido.`
      )
    ) {
      return
    }

    setLoading(true)

    try {
      // TODO: Integração com Resend para enviar e-mail
      // Por enquanto, apenas atualiza o status

      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'ENVIADO',
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', pedidoId)

      if (error) throw error

      // TODO: Chamar API para enviar e-mail
      // await fetch('/api/pedidos/enviar-email', {
      //   method: 'POST',
      //   body: JSON.stringify({ pedidoId }),
      // })

      alert(
        `Pedido ${numero} marcado como enviado!\n\n⚠️ Integração de e-mail será implementada em breve.`
      )
      router.refresh()
    } catch (error) {
      console.error('Erro ao enviar pedido:', error)
      alert('Erro ao processar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleEnviar} disabled={loading} size="sm">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Mail className="mr-2 h-4 w-4" />
      )}
      Enviar para Fornecedor
    </Button>
  )
}
