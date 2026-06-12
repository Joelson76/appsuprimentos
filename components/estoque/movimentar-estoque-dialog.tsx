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
import { ArrowUpDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface MovimentarEstoqueDialogProps {
  produtoId: string
  produtoNome: string
  estoqueAtual: number
  unidade: string
  trigger?: React.ReactNode
}

export function MovimentarEstoqueDialog({
  produtoId,
  produtoNome,
  estoqueAtual,
  unidade,
  trigger,
}: MovimentarEstoqueDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    tipo: 'ENTRADA' as
      | 'ENTRADA'
      | 'SAIDA'
      | 'AJUSTE_MAIS'
      | 'AJUSTE_MENOS'
      | 'TRANSFERENCIA',
    quantidade: '',
    observacao: '',
  })

  const tiposMovimentacao = [
    { value: 'ENTRADA', label: 'Entrada', icon: '⬆️' },
    { value: 'SAIDA', label: 'Saída', icon: '⬇️' },
    { value: 'AJUSTE_MAIS', label: 'Ajuste Positivo', icon: '➕' },
    { value: 'AJUSTE_MENOS', label: 'Ajuste Negativo', icon: '➖' },
  ]

  const calcularNovoSaldo = () => {
    const qtd = parseFloat(formData.quantidade || '0')
    if (formData.tipo === 'ENTRADA' || formData.tipo === 'AJUSTE_MAIS') {
      return estoqueAtual + qtd
    } else {
      return estoqueAtual - qtd
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.quantidade || parseFloat(formData.quantidade) <= 0) {
      toast.error('Informe uma quantidade válida')
      return
    }

    const novoSaldo = calcularNovoSaldo()
    if (novoSaldo < 0) {
      toast.error('Saldo insuficiente para esta movimentação')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Buscar usuário atual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Buscar tenant_id do produto
      const { data: produto } = await supabase
        .from('produtos')
        .select('tenant_id')
        .eq('id', produtoId)
        .single()

      if (!produto) throw new Error('Produto não encontrado')

      // Registrar movimentação
      const { error: movError } = await supabase
        .from('movimentacoes_estoque')
        .insert({
          tenant_id: produto.tenant_id,
          produto_id: produtoId,
          tipo: formData.tipo,
          quantidade: parseFloat(formData.quantidade),
          saldo_anterior: estoqueAtual,
          saldo_posterior: novoSaldo,
          usuario_id: user.id,
          observacao: formData.observacao || null,
        })

      if (movError) throw movError

      // Atualizar estoque do produto
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ estoque_atual: novoSaldo })
        .eq('id', produtoId)

      if (updateError) throw updateError

      toast.success('Movimentação registrada com sucesso!')
      setOpen(false)
      router.refresh()

      // Resetar form
      setFormData({
        tipo: 'ENTRADA',
        quantidade: '',
        observacao: '',
      })
    } catch (error: any) {
      console.error('Erro ao movimentar estoque:', error)
      toast.error(error.message || 'Erro ao registrar movimentação')
    } finally {
      setLoading(false)
    }
  }

  const novoSaldo = calcularNovoSaldo()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <ArrowUpDown className="mr-1 h-4 w-4" />
            Movimentar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentar Estoque</DialogTitle>
          <DialogDescription>{produtoNome}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Saldo Atual */}
          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
            <p className="text-2xl font-bold">
              {estoqueAtual.toFixed(3)} {unidade}
            </p>
          </div>

          {/* Tipo de Movimentação */}
          <div className="space-y-2">
            <Label htmlFor="tipo">
              Tipo de Movimentação <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: any) =>
                setFormData({ ...formData, tipo: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposMovimentacao.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.icon} {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantidade">
              Quantidade ({unidade}) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantidade"
              type="number"
              step="0.001"
              min="0.001"
              value={formData.quantidade}
              onChange={(e) =>
                setFormData({ ...formData, quantidade: e.target.value })
              }
              placeholder="0"
              required
            />
          </div>

          {/* Preview do Novo Saldo */}
          {formData.quantidade && (
            <div
              className={`p-4 rounded-lg ${
                novoSaldo < 0
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-green-50 border border-green-200'
              }`}
            >
              <p className="text-sm text-muted-foreground">Novo Saldo</p>
              <p
                className={`text-xl font-bold ${
                  novoSaldo < 0 ? 'text-red-700' : 'text-green-700'
                }`}
              >
                {novoSaldo >= 0 ? novoSaldo.toFixed(3) : 'SALDO INSUFICIENTE'}{' '}
                {novoSaldo >= 0 && unidade}
              </p>
            </div>
          )}

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={formData.observacao}
              onChange={(e) =>
                setFormData({ ...formData, observacao: e.target.value })
              }
              placeholder="Motivo da movimentação..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || novoSaldo < 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Movimentação'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
