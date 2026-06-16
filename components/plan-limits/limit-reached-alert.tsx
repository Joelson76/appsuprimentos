'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface LimitReachedAlertProps {
  type: 'usuario' | 'po' | 'storage'
  currentUsage: number
  limit: number
  onUpgrade?: () => void
}

export function LimitReachedAlert({
  type,
  currentUsage,
  limit,
  onUpgrade,
}: LimitReachedAlertProps) {
  const messages = {
    usuario: {
      title: 'Limite de Usuários Atingido',
      description: `Você está usando ${currentUsage} de ${limit} usuários do seu plano. Faça upgrade para adicionar mais usuários à sua equipe.`,
    },
    po: {
      title: 'Limite de Pedidos/Mês Atingido',
      description: `Você criou ${currentUsage} de ${limit} pedidos este mês. Faça upgrade do plano ou aguarde o reset no próximo mês.`,
    },
    storage: {
      title: 'Limite de Storage Atingido',
      description: `Você está usando ${currentUsage.toFixed(0)} de ${limit} MB de armazenamento. Faça upgrade para liberar mais espaço.`,
    },
  }

  const message = messages[type]

  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{message.title}</AlertTitle>
      <AlertDescription>
        <p className="mb-3">{message.description}</p>
        <div className="flex gap-2">
          <Button size="sm" asChild>
            <Link href="/configuracoes/planos">
              <TrendingUp className="mr-2 h-4 w-4" />
              Fazer Upgrade
            </Link>
          </Button>
          {onUpgrade && (
            <Button size="sm" variant="outline" onClick={onUpgrade}>
              Saiba Mais
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
