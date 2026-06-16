'use client'

import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, HardDrive } from 'lucide-react'

interface UsageProgressProps {
  type: 'usuario' | 'po' | 'storage'
  used: number
  limit: number
  showUpgrade?: boolean
}

export function UsageProgress({ type, used, limit, showUpgrade = true }: UsageProgressProps) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const isNearLimit = percentage >= 80 && !isUnlimited
  const isAtLimit = percentage >= 100 && !isUnlimited

  const icons = {
    usuario: Users,
    po: FileText,
    storage: HardDrive,
  }

  const labels = {
    usuario: 'Usuários',
    po: 'Pedidos / Mês',
    storage: 'Armazenamento',
  }

  const formatValue = (value: number) => {
    if (type === 'storage') {
      if (value < 1024) return `${value.toFixed(0)} MB`
      return `${(value / 1024).toFixed(2)} GB`
    }
    return value.toString()
  }

  const Icon = icons[type]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{labels[type]}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {formatValue(used)}
              {!isUnlimited && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  / {formatValue(limit)}
                </span>
              )}
            </div>
            {isUnlimited && (
              <Badge variant="secondary" className="ml-2">
                Ilimitado
              </Badge>
            )}
            {isAtLimit && (
              <Badge variant="destructive" className="ml-2">
                Limite Atingido
              </Badge>
            )}
            {isNearLimit && !isAtLimit && (
              <Badge variant="outline" className="ml-2 text-orange-600 border-orange-600">
                Próximo do Limite
              </Badge>
            )}
          </div>

          {!isUnlimited && (
            <>
              <Progress
                value={percentage}
                className={
                  isAtLimit
                    ? '[&>div]:bg-red-500'
                    : isNearLimit
                      ? '[&>div]:bg-orange-500'
                      : ''
                }
              />
              <p className="text-xs text-muted-foreground">
                {percentage.toFixed(0)}% utilizado
              </p>
            </>
          )}

          {isAtLimit && showUpgrade && (
            <p className="text-xs text-red-600 mt-2">
              Faça upgrade para continuar criando
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
