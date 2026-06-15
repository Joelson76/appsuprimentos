'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  prefix?: string
  suffix?: string
}

export function KPICard({ title, value, icon, trend, prefix = '', suffix = '' }: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <ArrowUp className="h-4 w-4 text-green-500" />
    if (trend.value < 0) return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    if (trend.value > 0) return 'text-green-600'
    if (trend.value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{value}{suffix}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${getTrendColor()} mt-1`}>
            {getTrendIcon()}
            <span>{Math.abs(trend.value)}% {trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
