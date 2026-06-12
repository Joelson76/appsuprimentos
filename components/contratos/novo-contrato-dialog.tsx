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
import { Switch } from '@/components/ui/switch'
import { Upload, Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface NovoContratoDialogProps {
  fornecedores?: Array<{
    id: string
    razao_social: string
  }>
}

export function NovoContratoDialog({
  fornecedores = [],
}: NovoContratoDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    fornecedor_id: '',
    titulo: '',
    numero: '',
    valor_total: '',
    inicio: '',
    fim: '',
    renovacao_auto: false,
    alerta_dias: '30',
    observacoes: '',
  })

  const handleArquivoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.')
      return
    }

    // Validar tipo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF ou DOC/DOCX.')
      return
    }

    setArquivo(file)
    toast.success(`Arquivo "${file.name}" selecionado`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fornecedor_id || !formData.titulo || !formData.inicio || !formData.fim) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Validar datas
    const dataInicio = new Date(formData.inicio)
    const dataFim = new Date(formData.fim)

    if (dataFim <= dataInicio) {
      toast.error('Data de fim deve ser posterior à data de início')
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

      // Upload do arquivo (se houver)
      let arquivo_path = null
      if (arquivo) {
        const fileName = `${Date.now()}_${arquivo.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(`contratos/${fileName}`, arquivo)

        if (uploadError) throw uploadError
        arquivo_path = uploadData.path
      }

      // Criar contrato
      const { data, error } = await supabase
        .from('contratos')
        .insert({
          tenant_id: profile.tenant_id,
          fornecedor_id: formData.fornecedor_id,
          titulo: formData.titulo,
          numero: formData.numero || null,
          valor_total: formData.valor_total ? parseFloat(formData.valor_total) : null,
          inicio: formData.inicio,
          fim: formData.fim,
          renovacao_auto: formData.renovacao_auto,
          alerta_dias: parseInt(formData.alerta_dias),
          arquivo_path,
          observacoes: formData.observacoes || null,
          status: 'ATIVO',
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Contrato cadastrado com sucesso!')
      setOpen(false)
      router.refresh()

      // Resetar form
      setFormData({
        fornecedor_id: '',
        titulo: '',
        numero: '',
        valor_total: '',
        inicio: '',
        fim: '',
        renovacao_auto: false,
        alerta_dias: '30',
        observacoes: '',
      })
      setArquivo(null)
    } catch (error: any) {
      console.error('Erro ao criar contrato:', error)
      toast.error(error.message || 'Erro ao cadastrar contrato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
          <DialogDescription>
            Cadastre um novo contrato com fornecedor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fornecedor */}
          <div className="space-y-2">
            <Label htmlFor="fornecedor_id">
              Fornecedor <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.fornecedor_id}
              onValueChange={(value) =>
                setFormData({ ...formData, fornecedor_id: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((forn) => (
                  <SelectItem key={forn.id} value={forn.id}>
                    {forn.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Título e Número */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título do Contrato <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                placeholder="Ex: Fornecimento de materiais"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número do Contrato</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) =>
                  setFormData({ ...formData, numero: e.target.value })
                }
                placeholder="Ex: 2026/001"
              />
            </div>
          </div>

          {/* Valor Total */}
          <div className="space-y-2">
            <Label htmlFor="valor_total">Valor Total (R$)</Label>
            <Input
              id="valor_total"
              type="number"
              step="0.01"
              value={formData.valor_total}
              onChange={(e) =>
                setFormData({ ...formData, valor_total: e.target.value })
              }
              placeholder="0,00"
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inicio">
                Data de Início <span className="text-red-500">*</span>
              </Label>
              <Input
                id="inicio"
                type="date"
                value={formData.inicio}
                onChange={(e) =>
                  setFormData({ ...formData, inicio: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fim">
                Data de Término <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fim"
                type="date"
                value={formData.fim}
                onChange={(e) =>
                  setFormData({ ...formData, fim: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Renovação Automática */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="renovacao_auto" className="text-base">
                Renovação Automática
              </Label>
              <p className="text-sm text-muted-foreground">
                Renovar automaticamente ao vencer
              </p>
            </div>
            <Switch
              id="renovacao_auto"
              checked={formData.renovacao_auto}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, renovacao_auto: checked })
              }
            />
          </div>

          {/* Alerta de Vencimento */}
          <div className="space-y-2">
            <Label htmlFor="alerta_dias">
              Alertar com antecedência (dias)
            </Label>
            <Input
              id="alerta_dias"
              type="number"
              min="1"
              max="365"
              value={formData.alerta_dias}
              onChange={(e) =>
                setFormData({ ...formData, alerta_dias: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Você será notificado {formData.alerta_dias} dias antes do vencimento
            </p>
          </div>

          {/* Upload de Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="arquivo">Anexar Documento (PDF, DOC)</Label>
            <Input
              id="arquivo"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleArquivoUpload}
              disabled={loading}
            />
            {arquivo && (
              <p className="text-sm text-green-600">
                ✓ {arquivo.name} ({(arquivo.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              placeholder="Informações adicionais sobre o contrato..."
              rows={3}
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
                  <Upload className="mr-2 h-4 w-4" />
                  Cadastrar Contrato
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
