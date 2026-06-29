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
} from 'recharts'

interface DadoMensalFilial {
  mes: string
  filial_id: string
  filial_nome: string
  cnpj: string
  is_matriz: boolean
  qtd_pedidos: number
  valor_total: number
}

interface BreakdownMensalFiliaisChartProps {
  data: DadoMensalFilial[]
}

export function BreakdownMensalFiliaisChart({ data }: BreakdownMensalFiliaisChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal por Filial/CNPJ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado mensal disponível
          </p>
        </CardContent>
      </Card>
    )
  }

  // Agrupar dados por mês
  const mesesUnicos = [...new Set(data.map(d => d.mes))].sort()
  const filiaisUnicas = [...new Set(data.map(d => d.filial_id))]

  // Criar estrutura de dados para o gráfico
  const chartData = mesesUnicos.map(mes => {
    const mesData: any = {
      mes: new Date(mes).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      mesCompleto: new Date(mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    }

    // Adicionar valor de cada filial neste mês
    data.filter(d => d.mes === mes).forEach(d => {
      const key = d.filial_nome
      mesData[key] = Number(d.valor_total) || 0
      mesData[`${key}_pedidos`] = d.qtd_pedidos
      mesData[`${key}_cnpj`] = d.cnpj
      mesData[`${key}_is_matriz`] = d.is_matriz
    })

    return mesData
  })

  // Cores para cada filial
  const COLORS = ['#667eea', '#764ba2', '#48bb78', '#ed8936', '#e53e3e']

  const filialInfo = data.reduce((acc, d) => {
    if (!acc[d.filial_nome]) {
      acc[d.filial_nome] = {
        nome: d.filial_nome,
        cnpj: d.cnpj,
        is_matriz: d.is_matriz,
        cor: COLORS[Object.keys(acc).length % COLORS.length]
      }
    }
    return acc
  }, {} as Record<string, any>)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return ''
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-2 capitalize">{payload[0]?.payload?.mesCompleto}</p>
          {payload.map((entry: any, index: number) => {
            const filialNome = entry.dataKey
            const cnpj = entry.payload[`${filialNome}_cnpj`]
            const pedidos = entry.payload[`${filialNome}_pedidos`]
            const isMatriz = entry.payload[`${filialNome}_is_matriz`]

            return (
              <div key={index} className="mb-2 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                  <p className="text-xs font-semibold">
                    {filialNome} {isMatriz && '(Matriz)'}
                  </p>
                </div>
                {cnpj && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono ml-5">
                    CNPJ: {formatCNPJ(cnpj)}
                  </p>
                )}
                <p className="text-sm font-bold text-blue-600 ml-5">
                  {formatCurrency(entry.value)}
                </p>
                <p className="text-xs text-gray-500 ml-5">
                  {pedidos} {pedidos === 1 ? 'pedido' : 'pedidos'}
                </p>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução Mensal por Filial/CNPJ</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="mes"
              angle={-45}
              textAnchor="end"
              height={80}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              formatter={(value) => {
                const info = filialInfo[value]
                if (info) {
                  return `${value}${info.is_matriz ? ' (Matriz)' : ''}`
                }
                return value
              }}
            />
            {Object.entries(filialInfo).map(([nome, info]: [string, any]) => (
              <Bar
                key={nome}
                dataKey={nome}
                fill={info.cor}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda com CNPJs */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs font-semibold text-muted-foreground mb-3">CNPJs:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(filialInfo).map(([nome, info]: [string, any]) => (
              <div key={nome} className="flex items-center gap-3 p-2 rounded-lg bg-accent/30">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: info.cor }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {nome} {info.is_matriz && <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded ml-1">MATRIZ</span>}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatCNPJ(info.cnpj)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
