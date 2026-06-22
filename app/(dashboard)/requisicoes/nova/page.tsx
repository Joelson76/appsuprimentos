'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SelectFilial } from '@/components/filiais/select-filial'
import { SelectorProduto } from '@/components/requisicoes/selector-produto'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Produto {
  id: string
  descricao: string
  codigo: string | null
  unidade: string
  estoque_atual: number
  custo_medio: number | null
  classificacao: string | null
}

interface Item {
  produto_id: string
  produto_descricao: string
  quantidade: number
  unidade: string
  valor_estimado: number
  observacao: string
}

export default function NovaRequisicaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [filialId, setFilialId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [urgencia, setUrgencia] = useState<'BAIXA' | 'NORMAL' | 'ALTA' | 'CRITICA'>('NORMAL')
  const [itens, setItens] = useState<Item[]>([
    { produto_id: '', produto_descricao: '', quantidade: 1, unidade: 'UN', valor_estimado: 0, observacao: '' },
  ])

  const addItem = () => {
    setItens([
      ...itens,
      { produto_id: '', produto_descricao: '', quantidade: 1, unidade: 'UN', valor_estimado: 0, observacao: '' },
    ])
  }

  const removeItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const newItens = [...itens]
    newItens[index] = { ...newItens[index], [field]: value }
    setItens(newItens)
  }

  const handleProdutoChange = (index: number, produto: Produto | null) => {
    const newItens = [...itens]
    if (produto) {
      newItens[index] = {
        ...newItens[index],
        produto_id: produto.id,
        produto_descricao: produto.descricao,
        unidade: produto.unidade,
        valor_estimado: produto.custo_medio || 0
      }
    } else {
      newItens[index] = {
        ...newItens[index],
        produto_id: '',
        produto_descricao: '',
        unidade: 'UN',
        valor_estimado: 0
      }
    }
    setItens(newItens)
  }

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Buscar usuário e profile
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não autenticado')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setError('Profile não encontrado')
        return
      }

      // Validar campos obrigatórios
      if (!descricao.trim()) {
        setError('A descrição é obrigatória')
        return
      }

      const itensValidos = itens.filter(
        (item) => item.produto_id && item.quantidade > 0
      )

      if (itensValidos.length === 0) {
        setError('Adicione pelo menos um item válido com produto selecionado')
        return
      }

      // Validar filial
      if (!filialId) {
        setError('Selecione a filial')
        return
      }

      // Criar requisição
      const { data: requisicao, error: reqError } = await supabase
        .from('requisicoes')
        .insert({
          tenant_id: profile.tenant_id,
          filial_id: filialId,
          solicitante_id: user.id,
          descricao: descricao.trim(),
          urgencia,
          status: saveAsDraft ? 'RASCUNHO' : 'AGUARDANDO_APROVACAO',
        })
        .select()
        .single()

      if (reqError) {
        throw reqError
      }

      // Criar itens da requisição
      const itensParaInserir = itensValidos.map((item) => ({
        requisicao_id: requisicao.id,
        produto_id: item.produto_id,
        descricao: item.produto_descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valor_estimado: item.valor_estimado > 0 ? item.valor_estimado : null,
        observacao: item.observacao.trim() || null,
      }))

      const { error: itensError } = await supabase
        .from('itens_requisicao')
        .insert(itensParaInserir)

      if (itensError) {
        throw itensError
      }

      // Sucesso
      toast.success(
        saveAsDraft
          ? 'Requisição salva como rascunho!'
          : 'Requisição enviada para aprovação!'
      )

      // Redirecionar para lista de requisições
      router.push('/requisicoes')
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao criar requisição:', err)
      setError(err.message || 'Erro ao criar requisição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/requisicoes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova Requisição de Compra</h1>
          <p className="text-muted-foreground mt-1">
            Preencha os dados para criar uma nova requisição
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="space-y-6">
          {/* Dados Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Gerais</CardTitle>
              <CardDescription>
                Informações básicas da requisição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seletor de Filial */}
              <SelectFilial
                value={filialId}
                onChange={setFilialId}
                required
                label="Filial / Unidade"
              />

              <div className="space-y-2">
                <Label htmlFor="descricao">
                  Descrição / Justificativa *
                </Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Compra de materiais para manutenção"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgencia">Urgência</Label>
                <Select
                  value={urgencia}
                  onValueChange={(value: any) => setUrgencia(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="CRITICA">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Itens */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Itens da Requisição</CardTitle>
                  <CardDescription>
                    Liste os produtos ou serviços necessários
                  </CardDescription>
                </div>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {itens.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg space-y-4 relative"
                >
                  {itens.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="absolute top-2 right-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}

                  <SelectorProduto
                    value={item.produto_id}
                    onChange={(produto) => handleProdutoChange(index, produto)}
                    required
                  />

                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'quantidade',
                            parseInt(e.target.value) || 1
                          )
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Input
                        value={item.unidade}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Unidade definida pelo produto
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Valor Estimado (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.valor_estimado || ''}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'valor_estimado',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Observação</Label>
                      <Input
                        placeholder="Ex: Entrega urgente"
                        value={item.observacao}
                        onChange={(e) =>
                          updateItem(index, 'observacao', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Link href="/requisicoes">
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar como Rascunho'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar para Aprovação'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
