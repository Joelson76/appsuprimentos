'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Save, Eye } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { PreviewTemplateDialog } from './preview-template-dialog'

interface EditarTemplateFormProps {
  template: any
}

export function EditarTemplateForm({ template }: EditarTemplateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const [formData, setFormData] = useState({
    nome: template.nome || '',
    descricao: template.descricao || '',
    assunto: template.assunto || '',
    corpo_html: template.corpo_html || '',
    corpo_texto: template.corpo_texto || '',
    ativo: template.ativo ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome || !formData.assunto || !formData.corpo_html) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('email_templates')
        .update({
          nome: formData.nome,
          descricao: formData.descricao || null,
          assunto: formData.assunto,
          corpo_html: formData.corpo_html,
          corpo_texto: formData.corpo_texto || null,
          ativo: formData.ativo,
          atualizado_por: user.id,
        })
        .eq('id', template.id)

      if (error) throw error

      toast.success('Template atualizado com sucesso!')
      router.push('/configuracoes/templates-email')
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao atualizar template:', error)
      toast.error(error.message || 'Erro ao atualizar template')
    } finally {
      setLoading(false)
    }
  }

  const templatePreview = {
    ...template,
    ...formData,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info do Tipo */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Tipo de Template
            </p>
            <p className="text-lg font-bold text-blue-700">
              {template.tipo.replace(/_/g, ' ')}
            </p>
          </div>
          <Badge variant={formData.ativo ? 'default' : 'secondary'}>
            {formData.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {template.variaveis_disponiveis && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs font-semibold text-blue-900 mb-2">
              Variáveis Disponíveis:
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(template.variaveis_disponiveis).map((key) => (
                <Badge key={key} variant="outline" className="text-xs font-mono">
                  {`{{${key}}}`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nome e Descrição */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">
            Nome do Template <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Ex: Template Personalizado"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            value={formData.descricao}
            onChange={(e) =>
              setFormData({ ...formData, descricao: e.target.value })
            }
            placeholder="Breve descrição"
          />
        </div>
      </div>

      {/* Assunto */}
      <div className="space-y-2">
        <Label htmlFor="assunto">
          Assunto do E-mail <span className="text-red-500">*</span>
        </Label>
        <Input
          id="assunto"
          value={formData.assunto}
          onChange={(e) =>
            setFormData({ ...formData, assunto: e.target.value })
          }
          placeholder="Ex: Nova Cotação #{{numero_cotacao}} - {{nome_empresa}}"
        />
        <p className="text-xs text-muted-foreground">
          Use variáveis como {`{{nome_empresa}}`}, {`{{numero_pedido}}`}, etc.
        </p>
      </div>

      {/* Corpo do E-mail em Abas */}
      <Tabs defaultValue="html" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="texto">Texto Puro</TabsTrigger>
        </TabsList>

        <TabsContent value="html" className="space-y-2">
          <Label htmlFor="corpo_html">
            Corpo do E-mail (HTML) <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="corpo_html"
            value={formData.corpo_html}
            onChange={(e) =>
              setFormData({ ...formData, corpo_html: e.target.value })
            }
            placeholder="<h1>Olá, {{nome}}!</h1>..."
            rows={20}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Use HTML completo com estilos inline para melhor compatibilidade
          </p>
        </TabsContent>

        <TabsContent value="texto" className="space-y-2">
          <Label htmlFor="corpo_texto">Corpo do E-mail (Texto Puro)</Label>
          <Textarea
            id="corpo_texto"
            value={formData.corpo_texto}
            onChange={(e) =>
              setFormData({ ...formData, corpo_texto: e.target.value })
            }
            placeholder="Versão em texto puro (fallback para clientes que não suportam HTML)"
            rows={20}
          />
          <p className="text-xs text-muted-foreground">
            Opcional: versão em texto para clientes de e-mail antigos
          </p>
        </TabsContent>
      </Tabs>

      {/* Ativo/Inativo */}
      <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg">
        <Switch
          id="ativo"
          checked={formData.ativo}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, ativo: checked })
          }
        />
        <Label htmlFor="ativo" className="cursor-pointer">
          Template ativo (será usado nos envios automáticos)
        </Label>
      </div>

      {/* Botões */}
      <div className="flex justify-between pt-4 border-t">
        <div className="space-x-2">
          <PreviewTemplateDialog
            template={templatePreview}
            trigger={
              <Button type="button" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            }
          />
        </div>

        <div className="space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/configuracoes/templates-email')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>
    </form>
  )
}
