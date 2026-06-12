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
import { Upload, Loader2, Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ProcessarNFeDialogProps {
  pedidos?: Array<{
    id: string
    numero: string
    fornecedor: { razao_social: string }
  }>
}

export function ProcessarNFeDialog({ pedidos = [] }: ProcessarNFeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [manualMode, setManualMode] = useState(false)

  const [formData, setFormData] = useState({
    pedido_id: '',
    numero: '',
    serie: '',
    chave_acesso: '',
    emissao: new Date().toISOString().split('T')[0],
    valor_total: '',
    observacoes: '',
  })

  const handleXmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xml')) {
      toast.error('Por favor, selecione um arquivo XML válido')
      return
    }

    setXmlFile(file)
    setLoading(true)

    try {
      // Ler conteúdo do XML
      const text = await file.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(text, 'text/xml')

      // Extrair dados básicos da NFe
      const nfeNode = xmlDoc.getElementsByTagName('NFe')[0]
      if (!nfeNode) {
        throw new Error('XML inválido: tag NFe não encontrada')
      }

      const infNFe = xmlDoc.getElementsByTagName('infNFe')[0]
      const ide = xmlDoc.getElementsByTagName('ide')[0]
      const total = xmlDoc.getElementsByTagName('total')[0]
      const ICMSTot = total?.getElementsByTagName('ICMSTot')[0]

      // Preencher formulário com dados do XML
      setFormData({
        ...formData,
        numero: ide?.getElementsByTagName('nNF')[0]?.textContent || '',
        serie: ide?.getElementsByTagName('serie')[0]?.textContent || '',
        chave_acesso: infNFe?.getAttribute('Id')?.replace('NFe', '') || '',
        emissao:
          ide?.getElementsByTagName('dhEmi')[0]?.textContent?.split('T')[0] ||
          formData.emissao,
        valor_total:
          ICMSTot?.getElementsByTagName('vNF')[0]?.textContent || '',
      })

      toast.success('XML carregado com sucesso!')
    } catch (error) {
      console.error('Erro ao processar XML:', error)
      toast.error('Erro ao processar XML. Verifique o arquivo.')
      setXmlFile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.pedido_id) {
      toast.error('Selecione um pedido de compra')
      return
    }

    if (!formData.numero || !formData.valor_total) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Upload do XML (se houver)
      let xml_path = null
      if (xmlFile) {
        const fileName = `${Date.now()}_${xmlFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(`nfe/${fileName}`, xmlFile)

        if (uploadError) throw uploadError
        xml_path = uploadData.path
      }

      // Criar nota fiscal
      const { data, error } = await supabase
        .from('notas_fiscais')
        .insert({
          pedido_id: formData.pedido_id,
          numero: formData.numero,
          serie: formData.serie || null,
          chave_acesso: formData.chave_acesso || null,
          emissao: formData.emissao,
          valor_total: parseFloat(formData.valor_total),
          xml_path,
          status: 'PENDENTE',
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Nota fiscal registrada com sucesso!')
      setOpen(false)
      router.refresh()

      // Resetar form
      setFormData({
        pedido_id: '',
        numero: '',
        serie: '',
        chave_acesso: '',
        emissao: new Date().toISOString().split('T')[0],
        valor_total: '',
        observacoes: '',
      })
      setXmlFile(null)
    } catch (error: any) {
      console.error('Erro ao processar NF-e:', error)
      toast.error(error.message || 'Erro ao processar nota fiscal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Processar NF-e
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Processar Nota Fiscal Eletrônica</DialogTitle>
          <DialogDescription>
            Faça upload do XML da NF-e ou preencha manualmente os dados
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload XML */}
          {!manualMode && (
            <div className="space-y-2">
              <Label>Upload do XML da NF-e</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".xml"
                  onChange={handleXmlUpload}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManualMode(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Manual
                </Button>
              </div>
              {xmlFile && (
                <p className="text-sm text-green-600">
                  ✓ {xmlFile.name} carregado
                </p>
              )}
            </div>
          )}

          {manualMode && (
            <div className="text-sm text-muted-foreground">
              Modo manual ativo.{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setManualMode(false)}
              >
                Usar XML
              </button>
            </div>
          )}

          {/* Pedido */}
          <div className="space-y-2">
            <Label htmlFor="pedido_id">
              Pedido de Compra <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.pedido_id}
              onValueChange={(value) =>
                setFormData({ ...formData, pedido_id: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o pedido" />
              </SelectTrigger>
              <SelectContent>
                {pedidos.map((pedido) => (
                  <SelectItem key={pedido.id} value={pedido.id}>
                    {pedido.numero} - {pedido.fornecedor.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Número e Série */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">
                Número da NF-e <span className="text-red-500">*</span>
              </Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) =>
                  setFormData({ ...formData, numero: e.target.value })
                }
                placeholder="123456"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serie">Série</Label>
              <Input
                id="serie"
                value={formData.serie}
                onChange={(e) =>
                  setFormData({ ...formData, serie: e.target.value })
                }
                placeholder="1"
              />
            </div>
          </div>

          {/* Chave de Acesso */}
          <div className="space-y-2">
            <Label htmlFor="chave_acesso">Chave de Acesso</Label>
            <Input
              id="chave_acesso"
              value={formData.chave_acesso}
              onChange={(e) =>
                setFormData({ ...formData, chave_acesso: e.target.value })
              }
              placeholder="44 dígitos"
              maxLength={44}
            />
          </div>

          {/* Data e Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emissao">
                Data de Emissão <span className="text-red-500">*</span>
              </Label>
              <Input
                id="emissao"
                type="date"
                value={formData.emissao}
                onChange={(e) =>
                  setFormData({ ...formData, emissao: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_total">
                Valor Total <span className="text-red-500">*</span>
              </Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                value={formData.valor_total}
                onChange={(e) =>
                  setFormData({ ...formData, valor_total: e.target.value })
                }
                placeholder="0,00"
                required
              />
            </div>
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
              placeholder="Observações adicionais..."
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
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Processar NF-e
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
