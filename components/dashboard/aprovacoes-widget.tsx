'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Aprovacao {
  id: string
  tipo_documento: string
  documento_numero: string
  documento_valor: number
  solicitante_nome: string
  criado_em: string
  prazo_ate: string | null
  em_atraso: boolean
}

export function AprovacoesWidget() {
  const [aprovacoes, setAprovacoes] = useState<Aprovacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAprovacoes()
  }, [])

  const fetchAprovacoes = () => {
    fetch('/api/aprovacoes')
      .then(res => res.json())
      .then(data => {
        setAprovacoes(data.slice(0, 5))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const handleAprovar = async (id: string) => {
    const response = await fetch('/api/aprovacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aprovacao_id: id, acao: 'APROVAR' })
    })

    if (response.ok) {
      fetchAprovacoes() // Recarrega
    }
  }

  const handleRejeitar = async (id: string) => {
    const justificativa = prompt('Justificativa para rejeição:')
    if (!justificativa) return

    const response = await fetch('/api/aprovacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aprovacao_id: id, acao: 'REJEITAR', justificativa })
    })

    if (response.ok) {
      fetchAprovacoes()
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Aprovações Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  if (aprovacoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Aprovações Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma aprovação pendente</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Aprovações Pendentes
          <Badge variant="default" className="ml-auto">
            {aprovacoes.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {aprovacoes.map((apr) => (
            <div key={apr.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{apr.tipo_documento}</Badge>
                    {apr.em_atraso && <Badge variant="destructive">ATRASADO</Badge>}
                  </div>
                  <p className="font-medium mt-1">{apr.documento_numero}</p>
                  <p className="text-xs text-muted-foreground">
                    Solicitante: {apr.solicitante_nome} •{' '}
                    {formatDistanceToNow(new Date(apr.criado_em), { locale: ptBR, addSuffix: true })}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apr.documento_valor)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="default" className="flex-1" onClick={() => handleAprovar(apr.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
                <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleRejeitar(apr.id)}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
