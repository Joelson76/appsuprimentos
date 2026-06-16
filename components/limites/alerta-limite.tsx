'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface LimiteStatus {
  dentro_limite: boolean
  usado: number
  limite: number
  percentual: number
  mensagem?: string
}

export function AlertaLimitePedidos() {
  const [status, setStatus] = useState<LimiteStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/limites/verificar?tipo=pedidos')
      .then((res) => res.json())
      .then((data) => {
        setStatus(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !status) return null

  // Se limite ilimitado, não mostra nada
  if (status.limite === -1) return null

  // Se ainda está dentro do limite e abaixo de 80%, não mostra
  if (status.dentro_limite && status.percentual < 80) return null

  // Se está entre 80-100%, mostra warning
  if (status.dentro_limite && status.percentual >= 80) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-900">Atenção: Limite de pedidos</AlertTitle>
        <AlertDescription className="text-orange-800">
          <p className="mb-2">
            Você usou {status.usado} de {status.limite} pedidos este mês ({status.percentual}%)
          </p>
          <Progress value={status.percentual} className="mb-3 h-2" />
          <Link href="/configuracoes/planos">
            <Button size="sm" variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-100">
              <TrendingUp className="h-4 w-4 mr-1" />
              Fazer Upgrade
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  // Se atingiu o limite (100% ou mais)
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Limite atingido!</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{status.mensagem}</p>
        <Progress value={100} className="mb-3 h-2" />
        <Link href="/configuracoes/planos">
          <Button size="sm" variant="default">
            <TrendingUp className="h-4 w-4 mr-1" />
            Fazer Upgrade Agora
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}
