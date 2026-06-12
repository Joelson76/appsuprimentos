'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  faturaId: string
}

export function GerarCobrancaButton({ faturaId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGerar = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/asaas/gerar-cobranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faturaId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar cobrança')
      }

      toast.success('Cobrança gerada no Asaas com sucesso!')
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao gerar cobrança'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleGerar} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Zap className="mr-2 h-4 w-4" />
      )}
      Gerar Cobrança Asaas
    </Button>
  )
}
