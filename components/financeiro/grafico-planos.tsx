'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Package } from 'lucide-react'

interface Props {
  distribuicao: Record<string, number>
}

const CORES = {
  BASICO: '#3b82f6',
  PROFISSIONAL: '#10b981',
  ENTERPRISE: '#8b5cf6',
}

export function GraficoPlanos({ distribuicao }: Props) {
  const dados = Object.entries(distribuicao).map(([plano, quantidade]) => ({
    name: plano,
    value: quantidade,
  }))

  const total = dados.reduce((acc, d) => acc + d.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Distribuição por Plano
        </CardTitle>
        <CardDescription>{total} assinaturas ativas</CardDescription>
      </CardHeader>
      <CardContent>
        {dados.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dados}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dados.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CORES[entry.name as keyof typeof CORES] || '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhuma assinatura ativa
          </div>
        )}
      </CardContent>
    </Card>
  )
}
