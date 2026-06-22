'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FormularioProdutoProps {
  produto?: any
  categorias: Array<{ id: string; nome: string }>
  fornecedores: Array<{ id: string; razao_social: string; nome_fantasia?: string }>
}

export function FormularioProduto({
  produto,
  categorias,
  fornecedores,
}: FormularioProdutoProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Informações básicas
    descricao: produto?.descricao || '',
    codigo: produto?.codigo || '',
    codigo_barras: produto?.codigo_barras || '',
    ncm: produto?.ncm || '',
    unidade: produto?.unidade || 'UN',
    categoria_id: produto?.categoria_id || '',
    classificacao: produto?.classificacao || '',

    // Estoque
    estoque_atual: produto?.estoque_atual || '0',
    estoque_minimo_alerta: produto?.estoque_minimo_alerta || '',
    estoque_maximo: produto?.estoque_maximo || '',
    localizacao: produto?.localizacao || '',

    // Fornecedor padrão
    fornecedor_id: produto?.fornecedor_id || '',

    // Financeiro
    custo_medio: produto?.custo_medio || '',
    custo_ultima_compra: produto?.custo_ultima_compra || '',
    preco_venda: produto?.preco_venda || '',

    // Detalhes
    marca: produto?.marca || '',
    modelo: produto?.modelo || '',
    especificacoes: produto?.especificacoes || '',
    observacoes: produto?.observacoes || '',

    // Dimensões e peso
    peso: produto?.peso || '',
    altura: produto?.altura || '',
    largura: produto?.largura || '',
    profundidade: produto?.profundidade || '',

    // Controle
    lote_obrigatorio: produto?.lote_obrigatorio || false,
    validade_obrigatoria: produto?.validade_obrigatoria || false,
    ativo: produto?.ativo !== undefined ? produto.ativo : true,
  })

  const unidades = [
    'UN', 'CX', 'PC', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'M²', 'M³',
    'PAR', 'DUZIA', 'CENTO', 'MILHEIRO', 'TON', 'GALAO', 'ROLO', 'FARDO'
  ]

  const classificacoes = [
    { value: 'COMPRAS_DIRETAS', label: 'Compras Diretas', description: 'Produtos para produção ou revenda' },
    { value: 'COMPRAS_INDIRETAS', label: 'Compras Indiretas', description: 'Insumos operacionais (MRO)' },
    { value: 'ATIVOS_IMOBILIZADOS', label: 'Ativos Imobilizados', description: 'Bens de capital (máquinas, equipamentos)' },
    { value: 'USO_IMEDIATO', label: 'Uso Imediato', description: 'Consumo direto sem estocagem' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descricao) {
      toast.error('Informe a descrição do produto')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) throw new Error('Tenant não encontrado')

      const dadosProduto = {
        tenant_id: profile.tenant_id,
        descricao: formData.descricao,
        codigo: formData.codigo || null,
        codigo_barras: formData.codigo_barras || null,
        ncm: formData.ncm || null,
        unidade: formData.unidade,
        categoria_id: formData.categoria_id || null,
        classificacao: formData.classificacao || null,
        estoque_atual: parseFloat(formData.estoque_atual) || 0,
        estoque_minimo_alerta: formData.estoque_minimo_alerta
          ? parseFloat(formData.estoque_minimo_alerta)
          : null,
        estoque_maximo: formData.estoque_maximo ? parseFloat(formData.estoque_maximo) : null,
        localizacao: formData.localizacao || null,
        fornecedor_id: formData.fornecedor_id || null,
        custo_medio: formData.custo_medio ? parseFloat(formData.custo_medio) : null,
        custo_ultima_compra: formData.custo_ultima_compra
          ? parseFloat(formData.custo_ultima_compra)
          : null,
        preco_venda: formData.preco_venda ? parseFloat(formData.preco_venda) : null,
        marca: formData.marca || null,
        modelo: formData.modelo || null,
        especificacoes: formData.especificacoes || null,
        observacoes: formData.observacoes || null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        largura: formData.largura ? parseFloat(formData.largura) : null,
        profundidade: formData.profundidade ? parseFloat(formData.profundidade) : null,
        lote_obrigatorio: formData.lote_obrigatorio,
        validade_obrigatoria: formData.validade_obrigatoria,
        ativo: formData.ativo,
      }

      if (produto?.id) {
        const { error } = await supabase
          .from('produtos')
          .update(dadosProduto)
          .eq('id', produto.id)

        if (error) throw error
        toast.success('Produto atualizado com sucesso!')
      } else {
        const { error } = await supabase.from('produtos').insert(dadosProduto)

        if (error) throw error
        toast.success('Produto cadastrado com sucesso!')
      }

      router.push('/estoque')
      router.refresh()
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(error.message || 'Erro ao salvar produto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="basico" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basico">Básico</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
        </TabsList>

        {/* ABA BÁSICO */}
        <TabsContent value="basico" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="descricao">
                Descrição <span className="text-red-500">*</span>
              </Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Nome do produto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código/SKU</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: PROD-001"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="codigo_barras">Código de Barras / EAN</Label>
              <Input
                id="codigo_barras"
                value={formData.codigo_barras}
                onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                placeholder="7891234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ncm">NCM</Label>
              <Input
                id="ncm"
                value={formData.ncm}
                onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                placeholder="12345678"
                maxLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select value={formData.unidade} onValueChange={(value) => setFormData({ ...formData, unidade: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoria_id">Categoria</Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classificacao">Classificação de Compra</Label>
              <Select
                value={formData.classificacao}
                onValueChange={(value) => setFormData({ ...formData, classificacao: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {classificacoes.map((classif) => (
                    <SelectItem key={classif.value} value={classif.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{classif.label}</span>
                        <span className="text-xs text-muted-foreground">{classif.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Marca do produto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                placeholder="Modelo"
              />
            </div>
          </div>
        </TabsContent>

        {/* ABA ESTOQUE */}
        <TabsContent value="estoque" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="estoque_atual">Estoque Atual</Label>
              <Input
                id="estoque_atual"
                type="number"
                step="0.001"
                value={formData.estoque_atual}
                onChange={(e) => setFormData({ ...formData, estoque_atual: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoque_minimo_alerta">Estoque Mínimo (Alerta)</Label>
              <Input
                id="estoque_minimo_alerta"
                type="number"
                step="0.001"
                value={formData.estoque_minimo_alerta}
                onChange={(e) => setFormData({ ...formData, estoque_minimo_alerta: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoque_maximo">Estoque Máximo</Label>
              <Input
                id="estoque_maximo"
                type="number"
                step="0.001"
                value={formData.estoque_maximo}
                onChange={(e) => setFormData({ ...formData, estoque_maximo: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="localizacao">Localização no Estoque</Label>
            <Input
              id="localizacao"
              value={formData.localizacao}
              onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              placeholder="Ex: Corredor A, Prateleira 3, Nível 2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedor_id">
              Fornecedor Padrão
              {fornecedores.length > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({fornecedores.length} disponíveis)
                </span>
              )}
            </Label>
            <Select
              value={formData.fornecedor_id}
              onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={fornecedores.length === 0 ? "Nenhum fornecedor cadastrado" : "Selecione..."} />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum fornecedor ativo encontrado
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
          </div>
        </TabsContent>

        {/* ABA FINANCEIRO */}
        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="custo_medio">Custo Médio (R$)</Label>
              <Input
                id="custo_medio"
                type="number"
                step="0.01"
                value={formData.custo_medio}
                onChange={(e) => setFormData({ ...formData, custo_medio: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custo_ultima_compra">Custo Última Compra (R$)</Label>
              <Input
                id="custo_ultima_compra"
                type="number"
                step="0.01"
                value={formData.custo_ultima_compra}
                onChange={(e) => setFormData({ ...formData, custo_ultima_compra: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_venda">Preço de Venda (R$)</Label>
              <Input
                id="preco_venda"
                type="number"
                step="0.01"
                value={formData.preco_venda}
                onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          {formData.custo_medio && formData.preco_venda && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Margem de Lucro:{' '}
                {(
                  ((parseFloat(formData.preco_venda) - parseFloat(formData.custo_medio)) /
                    parseFloat(formData.custo_medio)) *
                  100
                ).toFixed(2)}
                %
              </p>
            </div>
          )}
        </TabsContent>

        {/* ABA DETALHES */}
        <TabsContent value="detalhes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input
                id="peso"
                type="number"
                step="0.001"
                value={formData.peso}
                onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                placeholder="0.000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="altura">Altura (cm)</Label>
              <Input
                id="altura"
                type="number"
                step="0.01"
                value={formData.altura}
                onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="largura">Largura (cm)</Label>
              <Input
                id="largura"
                type="number"
                step="0.01"
                value={formData.largura}
                onChange={(e) => setFormData({ ...formData, largura: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profundidade">Profundidade (cm)</Label>
              <Input
                id="profundidade"
                type="number"
                step="0.01"
                value={formData.profundidade}
                onChange={(e) => setFormData({ ...formData, profundidade: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="especificacoes">Especificações Técnicas</Label>
            <Textarea
              id="especificacoes"
              value={formData.especificacoes}
              onChange={(e) => setFormData({ ...formData, especificacoes: e.target.value })}
              placeholder="Descreva as especificações técnicas do produto..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre o produto..."
              rows={3}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {produto ? 'Atualizar' : 'Cadastrar'} Produto
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
