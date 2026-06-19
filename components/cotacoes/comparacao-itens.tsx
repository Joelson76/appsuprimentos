'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Check } from 'lucide-react'

interface ItemComparacao {
  descricao: string
  quantidade: number
  propostas: Array<{
    itemId: string
    fornecedorId: string
    fornecedorNome: string
    valorUnitario: number | null
    prazoEntrega: number | null
    vencedor: boolean
  }>
}

interface Props {
  cotacaoId: string
  itens: any[]
  statusCotacao: string
}

export default function ComparacaoItens({ cotacaoId, itens, statusCotacao }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [vencedoresLocais, setVencedoresLocais] = useState<Record<string, boolean>>({})

  // Agrupar itens por descrição mantendo a ordem original
  const itensAgrupados: ItemComparacao[] = []
  const descricoesVistas = new Set<string>()

  itens.forEach((item) => {
    if (!descricoesVistas.has(item.descricao)) {
      descricoesVistas.add(item.descricao)

      const itensDesc = itens.filter((i) => i.descricao === item.descricao)
      const quantidade = itensDesc[0]?.quantidade || 0

      const propostas = itensDesc.map((it) => ({
        itemId: it.id,
        fornecedorId: it.fornecedor_id,
        fornecedorNome:
          it.fornecedor?.nome_fantasia || it.fornecedor?.razao_social || 'N/A',
        valorUnitario: it.valor_unitario,
        prazoEntrega: it.prazo_entrega,
        vencedor: vencedoresLocais[it.id] ?? it.vencedor,
      }))

      itensAgrupados.push({
        descricao: item.descricao,
        quantidade,
        propostas,
      })
    }
  })

  const marcarVencedor = async (itemId: string, descricao: string) => {
    setLoading(itemId)

    // Atualização otimista da UI
    const novosVencedores: Record<string, boolean> = {}
    itens.forEach((item) => {
      if (item.descricao === descricao) {
        novosVencedores[item.id] = item.id === itemId
      } else {
        novosVencedores[item.id] = vencedoresLocais[item.id] ?? item.vencedor
      }
    })
    setVencedoresLocais(novosVencedores)

    try {
      const supabase = createClient()

      // Marcar este item como vencedor
      const { error: updateError1 } = await supabase
        .from('itens_cotacao')
        .update({ vencedor: true })
        .eq('id', itemId)

      if (updateError1) {
        console.error('Erro ao marcar vencedor:', updateError1)
        throw updateError1
      }

      // Desmarcar outros itens com a mesma descrição nesta cotação
      const { error: updateError2 } = await supabase
        .from('itens_cotacao')
        .update({ vencedor: false })
        .eq('cotacao_id', cotacaoId)
        .eq('descricao', descricao)
        .neq('id', itemId)

      if (updateError2) {
        console.error('Erro ao desmarcar outros:', updateError2)
        throw updateError2
      }

      console.log('✅ Item marcado como vencedor:', itemId)
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao marcar vencedor:', err)
      alert(`Erro ao marcar vencedor: ${err.message || 'Erro desconhecido'}`)
      // Reverter em caso de erro
      setVencedoresLocais({})
    } finally {
      setLoading(null)
    }
  }

  const getMelhorPreco = (propostas: ItemComparacao['propostas']) => {
    const comPreco = propostas.filter((p) => p.valorUnitario !== null)
    if (comPreco.length === 0) return null
    return Math.min(...comPreco.map((p) => p.valorUnitario!))
  }

  const getMelhorPrazo = (propostas: ItemComparacao['propostas']) => {
    const comPrazo = propostas.filter((p) => p.prazoEntrega !== null)
    if (comPrazo.length === 0) return null
    return Math.min(...comPrazo.map((p) => p.prazoEntrega!))
  }

  const autoSelecionarMelhoresPrecos = async () => {
    setLoading('auto')

    // Atualização otimista da UI
    const novosVencedores: Record<string, boolean> = {}
    itensAgrupados.forEach((item) => {
      const melhorPreco = getMelhorPreco(item.propostas)
      if (melhorPreco) {
        const propostaMelhorPreco = item.propostas.find(
          (p) => p.valorUnitario === melhorPreco
        )
        item.propostas.forEach((p) => {
          novosVencedores[p.itemId] = p.itemId === propostaMelhorPreco?.itemId
        })
      }
    })
    setVencedoresLocais(novosVencedores)

    try {
      const supabase = createClient()

      // Para cada item, selecionar o de menor preço
      for (const item of itensAgrupados) {
        const melhorPreco = getMelhorPreco(item.propostas)
        if (!melhorPreco) continue

        const propostaMelhorPreco = item.propostas.find(
          (p) => p.valorUnitario === melhorPreco
        )
        if (!propostaMelhorPreco) continue

        // Marcar o melhor preço como vencedor
        await supabase
          .from('itens_cotacao')
          .update({ vencedor: true })
          .eq('id', propostaMelhorPreco.itemId)

        // Desmarcar outros itens com a mesma descrição
        await supabase
          .from('itens_cotacao')
          .update({ vencedor: false })
          .eq('cotacao_id', cotacaoId)
          .eq('descricao', item.descricao)
          .neq('id', propostaMelhorPreco.itemId)
      }

      router.refresh()
    } catch (err) {
      console.error('Erro ao auto-selecionar melhores preços:', err)
      alert('Erro ao selecionar melhores preços')
      // Reverter em caso de erro
      setVencedoresLocais({})
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {statusCotacao !== 'ENCERRADA' && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <h3 className="font-medium text-blue-900">
              Seleção por Melhor Preço
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Clique em "Auto-Selecionar" para escolher automaticamente os melhores preços,<br />
              ou clique na linha de qualquer fornecedor para selecionar manualmente
            </p>
          </div>
          <Button
            onClick={autoSelecionarMelhoresPrecos}
            disabled={loading === 'auto'}
            variant="default"
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            {loading === 'auto' ? 'Selecionando...' : 'Auto-Selecionar Melhores Preços'}
          </Button>
        </div>
      )}

      {itensAgrupados.map((item, idx) => {
        const melhorPreco = getMelhorPreco(item.propostas)
        const melhorPrazo = getMelhorPrazo(item.propostas)
        const jaTemVencedor = item.propostas.some((p) => p.vencedor)

        return (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-lg">
                {item.descricao}
                <span className="ml-3 text-sm font-normal text-muted-foreground">
                  Quantidade: {item.quantidade}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Valor Unitário</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Prazo (dias)</TableHead>
                    {statusCotacao !== 'ENCERRADA' && (
                      <TableHead className="text-right">Ação</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.propostas.map((proposta) => {
                    const isMelhorPreco =
                      melhorPreco && proposta.valorUnitario === melhorPreco
                    const isMelhorPrazo =
                      melhorPrazo && proposta.prazoEntrega === melhorPrazo

                    return (
                      <TableRow
                        key={proposta.itemId}
                        className={
                          proposta.vencedor
                            ? 'bg-green-50 border-l-4 border-l-green-500 hover:bg-green-100'
                            : statusCotacao !== 'ENCERRADA' && proposta.valorUnitario && !loading
                            ? 'hover:bg-slate-50 cursor-pointer'
                            : ''
                        }
                        onClick={() => {
                          if (
                            statusCotacao !== 'ENCERRADA' &&
                            proposta.valorUnitario &&
                            !loading &&
                            !proposta.vencedor
                          ) {
                            marcarVencedor(proposta.itemId, item.descricao)
                          }
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {proposta.vencedor && (
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                            {!proposta.vencedor && proposta.valorUnitario && statusCotacao !== 'ENCERRADA' && (
                              <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-300 hover:border-green-500 hover:bg-green-50">
                                <span className="text-xs text-slate-400"></span>
                              </div>
                            )}
                            <span className={proposta.vencedor ? 'font-semibold text-green-900' : ''}>
                              {proposta.fornecedorNome}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {proposta.valorUnitario ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className={proposta.vencedor ? 'font-bold text-green-900' : ''}>
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(proposta.valorUnitario)}
                              </span>
                              {isMelhorPreco && !proposta.vencedor && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                                  Menor preço
                                </span>
                              )}
                              {proposta.vencedor && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                                  Selecionado
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {proposta.valorUnitario ? (
                            <span className={proposta.vencedor ? 'font-bold text-green-900' : 'font-medium'}>
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(proposta.valorUnitario * item.quantidade)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {proposta.prazoEntrega ? (
                            <div className="flex items-center justify-end gap-2">
                              {proposta.prazoEntrega} dias
                              {isMelhorPrazo && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  Mais rápido
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        {statusCotacao !== 'ENCERRADA' && (
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {proposta.valorUnitario ? (
                              proposta.vencedor ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 border-green-500 text-green-700 hover:bg-green-50"
                                  disabled
                                >
                                  <Check className="h-4 w-4" />
                                  Selecionado
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    marcarVencedor(proposta.itemId, item.descricao)
                                  }}
                                  disabled={loading === proposta.itemId}
                                  className="hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                                >
                                  {loading === proposta.itemId
                                    ? 'Salvando...'
                                    : 'Selecionar'}
                                </Button>
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Aguardando proposta
                              </span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
