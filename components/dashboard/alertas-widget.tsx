'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package } from 'lucide-react'
import Link from 'next/link'

interface AlertaEstoque {
  produto_id: string
  descricao: string
  codigo: string
  estoque_atual: number
  estoque_minimo_alerta: number
  unidade: string
  prioridade: string
  nivel_estoque: string
}

export function AlertasWidget() {
  const [alertas, setAlertas] = useState<AlertaEstoque[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/alertas-estoque')
      .then(res => res.json())
      .then(data => {
        setAlertas(data.slice(0, 5)) // Top 5 alertas
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'CRITICA': return 'destructive'
      case 'ALTA': return 'destructive'
      case 'MEDIA': return 'default'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  if (alertas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            Alertas de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertas de Estoque
          <Badge variant="destructive" className="ml-auto">
            {alertas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alertas.map((alerta) => (
            <div key={alerta.produto_id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={getPrioridadeColor(alerta.prioridade)} className="text-xs">
                    {alerta.nivel_estoque}
                  </Badge>
                  <p className="font-medium text-sm">{alerta.descricao}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estoque: {alerta.estoque_atual} {alerta.unidade} (mínimo: {alerta.estoque_minimo_alerta})
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/estoque">
          <Button variant="outline" className="w-full mt-4" size="sm">
            Ver todos os alertas
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
