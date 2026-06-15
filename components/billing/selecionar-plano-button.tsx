'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  planoId: string
  nomePlano: string
  planoAtual?: string
}

export function SelecionarPlanoButton({
  planoId,
  nomePlano,
  planoAtual,
}: Props) {
  const router = useRouter()

  function handleClick() {
    router.push(`/configuracoes/assinatura/checkout?plano=${planoId}`)
  }

  return (
    <Button className="w-full" size="lg" onClick={handleClick}>
      Assinar {nomePlano}
    </Button>
  )
}
