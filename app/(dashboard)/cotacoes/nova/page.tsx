'use client'

import { useState, useEffect } from 'react'
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

export default function NovaCotacaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requisicoes, setRequisicoes] = useState<any[]>([])
  const [fornecedores, setFornecedores] = useState<any[]>([])

  const [requisicaoId, setRequisicaoId] = useState('')
  const [dataLimite, setDataLimite] = useState('')
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<
    string[]
  >([''])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Buscar requisições aprovadas
    const { data: reqs } = await supabase
      .from('requisicoes')
      .select('id, numero, descricao')
      .eq('status', 'APROVADA')
      .order('criado_em', { ascending: false })

    setRequisicoes(reqs || [])

    // Buscar fornecedores ativos
    const { data: forn } = await supabase
      .from('fornecedores')
      .select('id, razao_social, nome_fantasia')
      .eq('status', 'ATIVO')
      .order('razao_social')

    setFornecedores(forn || [])
  }

  const addFornecedor = () => {
    setFornecedoresSelecionados([...fornecedoresSelecionados, ''])
  }

  const removeFornecedor = (index: number) => {
    if (fornecedoresSelecionados.length > 1) {
      setFornecedoresSelecionados(
        fornecedoresSelecionados.filter((_, i) => i !== index)
      )
    }
  }

  const updateFornecedor = (index: number, value: string) => {
    const newFornecedores = [...fornecedoresSelecionados]
    newFornecedores[index] = value
    setFornecedoresSelecionados(newFornecedores)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

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

      // Validações
      if (!requisicaoId) {
        setError('Selecione uma requisição')
        return
      }

      if (!dataLimite) {
        setError('Informe a data limite')
        return
      }

      const fornecedoresValidos = fornecedoresSelecionados.filter((f) => f)

      if (fornecedoresValidos.length === 0) {
        setError('Selecione pelo menos um fornecedor')
        return
      }

      // Criar cotação
      const { data: cotacao, error: cotError } = await supabase
        .from('cotacoes')
        .insert({
          tenant_id: profile.tenant_id,
          requisicao_id: requisicaoId,
          data_limite: new Date(dataLimite).toISOString(),
          status: 'AGUARDANDO_RESPOSTAS',
        })
        .select()
        .single()

      if (cotError) {
        throw cotError
      }

      // Buscar itens da requisição
      const { data: itensReq } = await supabase
        .from('itens_requisicao')
        .select('*')
        .eq('requisicao_id', requisicaoId)

      // Criar itens da cotação
      if (itensReq && itensReq.length > 0) {
        const itensCotacao = itensReq.map((item: any) => ({
          tenant_id: profile.tenant_id,
          cotacao_id: cotacao.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
        }))

        await supabase.from('itens_cotacao').insert(itensCotacao)
      }

      // Criar registros de fornecedores da cotação
      const fornecedoresCotacao = fornecedoresValidos.map((fornId) => ({
        tenant_id: profile.tenant_id,
        cotacao_id: cotacao.id,
        fornecedor_id: fornId,
      }))

      await supabase.from('cotacao_fornecedores').insert(fornecedoresCotacao)

      // Atualizar status da requisição
      await supabase
        .from('requisicoes')
        .update({ status: 'EM_COTACAO' })
        .eq('id', requisicaoId)

      router.push('/cotacoes')
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao criar cotação:', err)
      setError(err.message || 'Erro ao criar cotação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cotacoes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova Cotação</h1>
          <p className="text-muted-foreground mt-1">
            Criar cotação baseada em requisição aprovada
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Cotação</CardTitle>
              <CardDescription>
                Selecione a requisição e configure a cotação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="requisicao">Requisição Aprovada *</Label>
                <Select value={requisicaoId} onValueChange={setRequisicaoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma requisição" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] z-50 bg-white border border-border shadow-lg">
                    {requisicoes.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        Nenhuma requisição aprovada encontrada
                      </div>
                    ) : (
                      requisicoes.map((req) => (
                        <SelectItem key={req.id} value={req.id}>
                          {req.numero} - {req.descricao?.substring(0, 50)}
                          {req.descricao?.length > 50 ? '...' : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataLimite">Data Limite para Resposta *</Label>
                <Input
                  id="dataLimite"
                  type="datetime-local"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Fornecedores</CardTitle>
                  <CardDescription>
                    Selecione os fornecedores que receberão a cotação
                  </CardDescription>
                </div>
                <Button type="button" onClick={addFornecedor} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Fornecedor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fornecedoresSelecionados.map((fornId, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={fornId}
                    onValueChange={(value) => updateFornecedor(index, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">
                          Nenhum fornecedor cadastrado
                        </div>
                      ) : (
                        fornecedores.map((forn) => (
                          <SelectItem key={forn.id} value={forn.id}>
                            {forn.nome_fantasia || forn.razao_social}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {fornecedoresSelecionados.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFornecedor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {fornecedores.length === 0 && (
                <div className="p-4 border border-dashed rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Você ainda não tem fornecedores cadastrados
                  </p>
                  <Link href="/fornecedores">
                    <Button variant="outline" size="sm">
                      Cadastrar Fornecedor
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/cotacoes">
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Cotação'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
