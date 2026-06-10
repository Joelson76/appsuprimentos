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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Item {
  produto: string
  descricao: string
  quantidade: number
  unidade: string
  valor_estimado: number
  observacao: string
}

export default function NovaRequisicaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [descricao, setDescricao] = useState('')
  const [urgencia, setUrgencia] = useState<'BAIXA' | 'NORMAL' | 'ALTA' | 'CRITICA'>('NORMAL')
  const [itens, setItens] = useState<Item[]>([
    { produto: '', descricao: '', quantidade: 1, unidade: 'UN', valor_estimado: 0, observacao: '' },
  ])

  const addItem = () => {
    setItens([
      ...itens,
      { produto: '', descricao: '', quantidade: 1, unidade: 'UN', valor_estimado: 0, observacao: '' },
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
        (item) => (item.produto.trim() || item.descricao.trim()) && item.quantidade > 0
      )

      if (itensValidos.length === 0) {
        setError('Adicione pelo menos um item válido')
        return
      }

      // Criar requisição
      const { data: requisicao, error: reqError } = await supabase
        .from('requisicoes')
        .insert({
          tenant_id: profile.tenant_id,
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
        produto: item.produto.trim() || null,
        descricao: item.descricao.trim(),
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Produto / Serviço</Label>
                      <Input
                        placeholder="Ex: Parafuso M8"
                        value={item.produto}
                        onChange={(e) =>
                          updateItem(index, 'produto', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição *</Label>
                      <Input
                        placeholder="Ex: Aço inox, 100 unidades"
                        value={item.descricao}
                        onChange={(e) =>
                          updateItem(index, 'descricao', e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

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
                      <Select
                        value={item.unidade}
                        onValueChange={(value) =>
                          updateItem(index, 'unidade', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UN">Unidade</SelectItem>
                          <SelectItem value="CX">Caixa</SelectItem>
                          <SelectItem value="KG">Quilograma</SelectItem>
                          <SelectItem value="L">Litro</SelectItem>
                          <SelectItem value="M">Metro</SelectItem>
                          <SelectItem value="M2">Metro²</SelectItem>
                          <SelectItem value="M3">Metro³</SelectItem>
                          <SelectItem value="PC">Peça</SelectItem>
                          <SelectItem value="PCT">Pacote</SelectItem>
                        </SelectContent>
                      </Select>
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
