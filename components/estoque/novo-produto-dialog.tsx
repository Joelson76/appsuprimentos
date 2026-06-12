'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Package, Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface NovoProdutoDialogProps {
  categorias?: Array<{
    id: string
    nome: string
  }>
}

export function NovoProdutoDialog({ categorias = [] }: NovoProdutoDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    descricao: '',
    codigo: '',
    unidade: 'UN',
    categoria_id: '',
    estoque_atual: '0',
    estoque_minimo_alerta: '',
    localizacao: '',
  })

  const unidades = [
    'UN', // Unidade
    'CX', // Caixa
    'PC', // Peça
    'KG', // Quilograma
    'G',  // Grama
    'L',  // Litro
    'ML', // Mililitro
    'M',  // Metro
    'CM', // Centímetro
    'M²', // Metro quadrado
    'M³', // Metro cúbico
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

      // Buscar tenant_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) {
        throw new Error('Tenant não encontrado')
      }

      const { data, error } = await supabase
        .from('produtos')
        .insert({
          tenant_id: profile.tenant_id,
          descricao: formData.descricao,
          codigo: formData.codigo || null,
          unidade: formData.unidade,
          categoria_id: formData.categoria_id || null,
          estoque_atual: parseFloat(formData.estoque_atual),
          estoque_minimo_alerta: formData.estoque_minimo_alerta
            ? parseFloat(formData.estoque_minimo_alerta)
            : null,
          localizacao: formData.localizacao || null,
          ativo: true,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Produto cadastrado com sucesso!')
      setOpen(false)
      router.refresh()

      // Resetar form
      setFormData({
        descricao: '',
        codigo: '',
        unidade: 'UN',
        categoria_id: '',
        estoque_atual: '0',
        estoque_minimo_alerta: '',
        localizacao: '',
      })
    } catch (error: any) {
      console.error('Erro ao cadastrar produto:', error)
      toast.error(error.message || 'Erro ao cadastrar produto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
          <DialogDescription>
            Cadastre um novo produto no estoque
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">
              Descrição do Produto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Ex: Parafuso M8 x 20mm"
              required
            />
          </div>

          {/* Código e Unidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código (SKU)</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                placeholder="Ex: PARA-M8-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade">
                Unidade <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.unidade}
                onValueChange={(value) =>
                  setFormData({ ...formData, unidade: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((un) => (
                    <SelectItem key={un} value={un}>
                      {un}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria_id">Categoria</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) =>
                setFormData({ ...formData, categoria_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
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

          {/* Estoque Atual e Mínimo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estoque_atual">Estoque Inicial</Label>
              <Input
                id="estoque_atual"
                type="number"
                step="0.001"
                value={formData.estoque_atual}
                onChange={(e) =>
                  setFormData({ ...formData, estoque_atual: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoque_minimo_alerta">
                Estoque Mínimo (Alerta)
              </Label>
              <Input
                id="estoque_minimo_alerta"
                type="number"
                step="0.001"
                value={formData.estoque_minimo_alerta}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estoque_minimo_alerta: e.target.value,
                  })
                }
                placeholder="Ex: 10"
              />
              <p className="text-xs text-muted-foreground">
                Você será alertado quando atingir este valor
              </p>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <Label htmlFor="localizacao">Localização</Label>
            <Input
              id="localizacao"
              value={formData.localizacao}
              onChange={(e) =>
                setFormData({ ...formData, localizacao: e.target.value })
              }
              placeholder="Ex: Prateleira A-12, Depósito 2"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Cadastrar Produto
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
