'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface BreakdownFilial {
  filial_id: string
  filial_nome: string
  cnpj: string
  is_matriz: boolean
  total_requisicoes: number
  total_pedidos: number
  total_cotacoes: number
  valor_pedidos: number
}

interface BreakdownFiliaisChartProps {
  data: BreakdownFilial[]
}

export function BreakdownFiliaisChart({ data }: BreakdownFiliaisChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos por Filial</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma filial com dados
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((filial) => ({
    nome: filial.filial_nome + (filial.is_matriz ? ' (Matriz)' : ''),
    valor: Number(filial.valor_pedidos) || 0,
    pedidos: filial.total_pedidos || 0,
    requisicoes: filial.total_requisicoes || 0,
    is_matriz: filial.is_matriz,
  }))

  const COLORS = {
    matriz: '#667eea',
    filial: '#764ba2',
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos por Filial</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="nome"
              angle={-45}
              textAnchor="end"
              height={100}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'valor') return formatCurrency(value)
                return value
              }}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                if (value === 'valor') return 'Valor Total'
                if (value === 'pedidos') return 'Qtd Pedidos'
                if (value === 'requisicoes') return 'Qtd Requisições'
                return value
              }}
            />
            <Bar dataKey="valor" name="valor" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.is_matriz ? COLORS.matriz : COLORS.filial}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda de cores */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.matriz }}
            />
            <span className="text-xs text-muted-foreground">Matriz</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.filial }}
            />
            <span className="text-xs text-muted-foreground">Filial</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
