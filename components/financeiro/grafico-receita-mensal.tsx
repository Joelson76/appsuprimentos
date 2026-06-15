'use client'

import {
  Card,
  CardContent,
  CardDescription,
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
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface Props {
  faturas: Array<{
    valor: number
    status: string
    criado_em: string
  }>
}

export function GraficoReceitaMensal({ faturas }: Props) {
  // Agrupar por mês
  const dadosPorMes = faturas
    .filter((f) => f.status === 'PAGO')
    .reduce((acc: any, fatura) => {
      const data = new Date(fatura.criado_em)
      const mesAno = data.toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      })

      if (!acc[mesAno]) {
        acc[mesAno] = { mes: mesAno, valor: 0, quantidade: 0 }
      }

      acc[mesAno].valor += Number(fatura.valor)
      acc[mesAno].quantidade += 1

      return acc
    }, {})

  const dados = Object.values(dadosPorMes)
    .sort((a: any, b: any) => {
      const [mesA, anoA] = a.mes.split('/')
      const [mesB, anoB] = b.mes.split('/')
      return (
        new Date(`20${anoA}-${mesA}-01`).getTime() -
        new Date(`20${anoB}-${mesB}-01`).getTime()
      )
    })
    .slice(-12) // Últimos 12 meses

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(valor)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Receita Mensal
        </CardTitle>
        <CardDescription>Últimos 12 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value) => formatarMoeda(value)}
            />
            <Tooltip
              formatter={(value) => formatarMoeda(Number(value))}
              labelStyle={{ color: '#000' }}
              contentStyle={{ borderRadius: 8 }}
            />
            <Bar dataKey="valor" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
