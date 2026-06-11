'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Building2, Calendar, CheckCircle2 } from 'lucide-react'

interface PageProps {
  params: {
    token: string
  }
}

export default function FornecedorCotacaoPage({ params }: PageProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [acesso, setAcesso] = useState<any>(null)
  const [cotacao, setCotacao] = useState<any>(null)
  const [fornecedor, setFornecedor] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [params.token])

  const loadData = async () => {
    try {
      const supabase = createClient()

      // Buscar acesso pelo token
      const { data: acessoData, error: acessoError } = await supabase
        .from('cotacao_acessos')
        .select(
          `
          *,
          cotacao:cotacoes (*),
          fornecedor:fornecedores (razao_social, nome_fantasia)
        `
        )
        .eq('token', params.token)
        .single()

      if (acessoError || !acessoData) {
        setError('Link inválido ou expirado')
        setLoading(false)
        return
      }

      setAcesso(acessoData)
      setCotacao(acessoData.cotacao)
      setFornecedor(acessoData.fornecedor)

      // Buscar itens desta cotação para este fornecedor
      const { data: itensData, error: itensError } = await supabase
        .from('itens_cotacao')
        .select('*')
        .eq('cotacao_id', acessoData.cotacao_id)
        .eq('fornecedor_id', acessoData.fornecedor_id)

      if (itensError) {
        throw itensError
      }

      setItens(itensData || [])

      // Registrar acesso
      if (!acessoData.acessado_em) {
        await supabase
          .from('cotacao_acessos')
          .update({ acessado_em: new Date().toISOString() })
          .eq('id', acessoData.id)
      }

      setLoading(false)
    } catch (err: any) {
      console.error('Erro ao carregar:', err)
      setError('Erro ao carregar cotação')
      setLoading(false)
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...itens]
    newItens[index] = { ...newItens[index], [field]: value }
    setItens(newItens)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const supabase = createClient()

      // Validar preços
      const todosPreenchidos = itens.every((item) => item.preco_unitario > 0)

      if (!todosPreenchidos) {
        setError('Preencha o preço de todos os itens')
        setSubmitting(false)
        return
      }

      // Atualizar itens
      for (const item of itens) {
        const { error: updateError } = await supabase
          .from('itens_cotacao')
          .update({
            preco_unitario: parseFloat(item.preco_unitario),
            prazo_entrega: item.prazo_entrega
              ? parseInt(item.prazo_entrega)
              : null,
            observacoes: item.observacoes || null,
          })
          .eq('id', item.id)

        if (updateError) {
          throw updateError
        }
      }

      // Marcar como respondido
      await supabase
        .from('cotacao_acessos')
        .update({ respondido_em: new Date().toISOString() })
        .eq('id', acesso.id)

      setSuccess(true)
    } catch (err: any) {
      console.error('Erro ao enviar proposta:', err)
      setError(err.message || 'Erro ao enviar proposta')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando cotação...</p>
        </div>
      </div>
    )
  }

  if (error && !cotacao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <CardTitle className="text-2xl">Proposta Enviada!</CardTitle>
              <CardDescription className="mt-2">
                Sua proposta foi enviada com sucesso. Aguarde o retorno do
                comprador.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const totalGeral = itens.reduce(
    (sum, item) =>
      sum + (parseFloat(item.preco_unitario) || 0) * item.quantidade,
    0
  )

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">
                  Responder Cotação {cotacao.numero}
                </CardTitle>
                <CardDescription className="mt-1">
                  {fornecedor.nome_fantasia || fornecedor.razao_social}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Prazo para resposta:{' '}
                {new Date(cotacao.data_limite).toLocaleDateString('pt-BR', {
                  dateStyle: 'full',
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Itens da Cotação</CardTitle>
              <CardDescription>
                Preencha os preços e prazos para cada item
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Unidade</TableHead>
                    <TableHead className="w-[150px]">Preço Unit. *</TableHead>
                    <TableHead className="w-[120px]">
                      Prazo (dias)
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.descricao}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantidade}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.unidade}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={item.preco_unitario || ''}
                          onChange={(e) =>
                            updateItem(index, 'preco_unitario', e.target.value)
                          }
                          required
                          disabled={acesso.respondido_em}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Ex: 7"
                          value={item.prazo_entrega || ''}
                          onChange={(e) =>
                            updateItem(index, 'prazo_entrega', e.target.value)
                          }
                          disabled={acesso.respondido_em}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.preco_unitario
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(item.preco_unitario * item.quantidade)
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-bold">
                      Total Geral:
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totalGeral)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-6 space-y-2">
                <Label htmlFor="observacoes">
                  Observações Gerais (opcional)
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Condições de pagamento, garantia, etc."
                  value={itens[0]?.observacoes || ''}
                  onChange={(e) =>
                    itens.forEach((_, i) =>
                      updateItem(i, 'observacoes', e.target.value)
                    )
                  }
                  rows={4}
                  disabled={acesso.respondido_em}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end">
            {acesso.respondido_em ? (
              <div className="text-green-600 font-medium flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Proposta já enviada em{' '}
                {new Date(acesso.respondido_em).toLocaleString('pt-BR')}
              </div>
            ) : (
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar Proposta'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
