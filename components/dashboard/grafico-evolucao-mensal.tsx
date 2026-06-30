'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type PeriodoMeses = 3 | 6 | 9 | 12

interface DadosFilialMes {
  mes: string
  filial_id: string
  filial_nome: string
  cnpj: string
  is_matriz: boolean
  total_pedidos: number
  valor_pedidos: number
}

interface Props {
  tenantId: string
  dadosIniciais: DadosFilialMes[]
}

export function GraficoEvolucaoMensal({ tenantId, dadosIniciais }: Props) {
  const [periodo, setPeriodo] = useState<PeriodoMeses>(6)
  const [dados, setDados] = useState<DadosFilialMes[]>(dadosIniciais)
  const [carregando, setCarregando] = useState(false)

  const carregarDados = async (meses: PeriodoMeses) => {
    setCarregando(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .rpc('get_breakdown_mensal_filiais', {
        p_tenant_id: tenantId,
        p_meses: meses
      })

    if (!error && data) {
      setDados(data)
    }

    setPeriodo(meses)
    setCarregando(false)
  }

  // Map: CNPJ -> Array de {mes, valor}
  const filiaisMap = new Map<string, any[]>()

  dados.forEach((item: any) => {
    const chave = item.cnpj || 'SEM_CNPJ'
    if (!filiaisMap.has(chave)) {
      filiaisMap.set(chave, [])
    }
    filiaisMap.get(chave)!.push(item)
  })

  // Pegar meses únicos
  const mesesUnicos = Array.from(
    new Set(dados.map((d: any) => d.mes))
  )
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-periodo)

  // Valor máximo para escala
  const valorMax = Math.max(
    ...dados.map((d: any) => Number(d.valor_pedidos) || 0),
    1
  )

  // Cores por mês
  const coresMes = [
    'bg-blue-500',
    'bg-cyan-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-violet-500',
    'bg-lime-500',
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução Mensal de Pedidos por Filial
          </CardTitle>

          {/* Botões de Período */}
          <div className="flex gap-2">
            {([3, 6, 9, 12] as PeriodoMeses[]).map((meses) => (
              <button
                key={meses}
                onClick={() => carregarDados(meses)}
                disabled={carregando}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${periodo === meses
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }
                  ${carregando ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {meses}m
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!dados || dados.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum pedido cadastrado ainda</p>
            <p className="text-xs mt-1">Comece criando requisições e pedidos</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gráfico de barras agrupadas */}
            <div className="flex items-end justify-between gap-6 h-80 pb-4">
              {Array.from(filiaisMap.entries()).map(([cnpj, dadosFilial]) => {
                const info = dadosFilial[0]
                const nomeFilial = info?.filial_nome || 'Sem Nome'
                const isMatriz = info?.is_matriz || false

                return (
                  <div key={cnpj} className="flex-1 flex flex-col items-center gap-3">
                    {/* Barras (uma por mês) */}
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {mesesUnicos.map((mes, idx) => {
                        const dadoMes = dadosFilial.find((d: any) => d.mes === mes)
                        const valor = Number(dadoMes?.valor_pedidos) || 0
                        const altura = (valor / valorMax) * 100

                        // Formatar mês
                        let mesAbrev = 'N/A'
                        try {
                          const [year, month] = mes.toString().substring(0, 7).split('-')
                          const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
                          mesAbrev = meses[parseInt(month) - 1] || 'N/A'
                        } catch (e) {
                          console.error('Erro ao formatar mês:', mes, e)
                        }

                        return (
                          <div
                            key={idx}
                            className="flex-1 group relative flex items-end"
                            style={{ maxWidth: '48px' }}
                          >
                            <div className="relative w-full h-full">
                              {/* Valor fixo sempre visível */}
                              {valor > 0 && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground whitespace-nowrap">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    maximumFractionDigits: 0
                                  }).format(valor)}
                                </div>
                              )}
                              {/* Barra */}
                              <div
                                className={`w-full ${coresMes[idx % coresMes.length]} rounded-t transition-all duration-300 hover:opacity-80 border border-gray-300`}
                                style={{
                                  height: `${altura}%`,
                                  minHeight: valor > 0 ? '20px' : '0'
                                }}
                                title={`${nomeFilial} - ${mesAbrev}: ${new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(valor)}`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Label da Filial */}
                    <div className="text-center p-3 bg-accent/30 rounded-lg w-full">
                      <div className="flex items-center justify-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-bold truncate">
                          {nomeFilial}
                        </p>
                        {isMatriz && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-semibold">
                            M
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legenda de Meses */}
            <div className="flex items-center justify-center gap-4 flex-wrap border-t pt-4">
              {mesesUnicos.map((mes, idx) => {
                let mesAbrev = 'N/A'
                try {
                  const [year, month] = mes.toString().substring(0, 7).split('-')
                  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
                  mesAbrev = `${meses[parseInt(month) - 1]} ${year.substring(2)}`
                } catch (e) {
                  console.error('Erro ao formatar mês legenda:', mes, e)
                }
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${coresMes[idx % coresMes.length]}`} />
                    <span className="text-xs font-medium capitalize">{mesAbrev}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
