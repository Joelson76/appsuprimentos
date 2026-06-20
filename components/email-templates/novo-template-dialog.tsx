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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface NovoTemplateDialogProps {
  trigger: React.ReactNode
}

export function NovoTemplateDialog({ trigger }: NovoTemplateDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    tipo: '',
    nome: '',
    descricao: '',
    assunto: '',
    corpo_html: '',
    corpo_texto: '',
    ativo: true,
  })

  const tiposDisponiveis = [
    { value: 'COTACAO_ENVIADA', label: 'Cotação Enviada' },
    { value: 'COTACAO_RESPONDIDA', label: 'Cotação Respondida' },
    { value: 'PEDIDO_CRIADO', label: 'Pedido Criado' },
    { value: 'PEDIDO_APROVADO', label: 'Pedido Aprovado' },
    { value: 'PEDIDO_CANCELADO', label: 'Pedido Cancelado' },
    { value: 'ESTOQUE_BAIXO', label: 'Alerta de Estoque Baixo' },
    { value: 'REQUISICAO_CRIADA', label: 'Requisição Criada' },
    { value: 'REQUISICAO_APROVADA', label: 'Requisição Aprovada' },
    { value: 'REQUISICAO_REJEITADA', label: 'Requisição Rejeitada' },
    { value: 'CONVITE_USUARIO', label: 'Convite de Usuário' },
    { value: 'BEM_VINDO', label: 'Boas-vindas' },
    { value: 'FATURA_GERADA', label: 'Fatura Gerada' },
    { value: 'FATURA_VENCIDA', label: 'Fatura Vencida' },
    { value: 'ASSINATURA_CANCELADA', label: 'Assinatura Cancelada' },
  ]

  const variaveis_por_tipo: Record<string, Record<string, string>> = {
    COTACAO_ENVIADA: {
      nome_empresa: 'Nome da empresa',
      numero_cotacao: 'Número da cotação',
      fornecedor_nome: 'Nome do fornecedor',
      total_itens: 'Total de itens',
      prazo_resposta: 'Prazo para resposta',
    },
    PEDIDO_CRIADO: {
      nome_empresa: 'Nome da empresa',
      numero_pedido: 'Número do pedido',
      fornecedor_nome: 'Nome do fornecedor',
      valor_total: 'Valor total',
      prazo_entrega: 'Prazo de entrega',
    },
    ESTOQUE_BAIXO: {
      nome_empresa: 'Nome da empresa',
      produto_nome: 'Nome do produto',
      estoque_atual: 'Estoque atual',
      estoque_minimo: 'Estoque mínimo',
    },
    REQUISICAO_CRIADA: {
      nome_empresa: 'Nome da empresa',
      numero_requisicao: 'Número da requisição',
      solicitante_nome: 'Nome do solicitante',
      total_itens: 'Total de itens',
    },
    CONVITE_USUARIO: {
      nome_empresa: 'Nome da empresa',
      usuario_nome: 'Nome do usuário',
      link_aceite: 'Link para aceitar convite',
      perfil: 'Perfil do usuário',
    },
    BEM_VINDO: {
      nome_empresa: 'Nome da empresa',
      usuario_nome: 'Nome do usuário',
      email: 'E-mail do usuário',
    },
    FATURA_GERADA: {
      nome_empresa: 'Nome da empresa',
      valor: 'Valor da fatura',
      vencimento: 'Data de vencimento',
      link_pagamento: 'Link para pagamento',
    },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.tipo || !formData.nome || !formData.assunto || !formData.corpo_html) {
      toast.error('Preencha os campos obrigatórios')
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

      if (!profile) throw new Error('Perfil não encontrado')

      // Obter variáveis disponíveis para o tipo
      const variaveis = variaveis_por_tipo[formData.tipo] || {}

      const { error } = await supabase.from('email_templates').insert({
        tenant_id: profile.tenant_id,
        tipo: formData.tipo,
        nome: formData.nome,
        descricao: formData.descricao || null,
        assunto: formData.assunto,
        corpo_html: formData.corpo_html,
        corpo_texto: formData.corpo_texto || null,
        ativo: formData.ativo,
        variaveis_disponiveis: variaveis,
        criado_por: user.id,
        atualizado_por: user.id,
      })

      if (error) throw error

      toast.success('Template criado com sucesso!')
      setOpen(false)
      router.refresh()

      // Limpar form
      setFormData({
        tipo: '',
        nome: '',
        descricao: '',
        assunto: '',
        corpo_html: '',
        corpo_texto: '',
        ativo: true,
      })
    } catch (error: any) {
      console.error('Erro ao criar template:', error)
      toast.error(error.message || 'Erro ao criar template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Template de E-mail</DialogTitle>
          <DialogDescription>
            Crie um template personalizado para envios automáticos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Template <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposDisponiveis.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome do Template <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Padrão de Cotação"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Breve descrição do template"
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="corpo_html">
              Corpo do E-mail (HTML) <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="corpo_html"
              value={formData.corpo_html}
              onChange={(e) =>
                setFormData({ ...formData, corpo_html: e.target.value })
              }
              placeholder={`<h1>Olá, {{fornecedor_nome}}!</h1>
<p>Você recebeu uma nova cotação...</p>`}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="corpo_texto">
              Corpo do E-mail (Texto Puro) - Opcional
            </Label>
            <Textarea
              id="corpo_texto"
              value={formData.corpo_texto}
              onChange={(e) =>
                setFormData({ ...formData, corpo_texto: e.target.value })
              }
              placeholder="Versão em texto puro (fallback)"
              rows={5}
            />
          </div>

          {formData.tipo && variaveis_por_tipo[formData.tipo] && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold mb-2">
                Variáveis disponíveis para este tipo:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(variaveis_por_tipo[formData.tipo]).map(
                  ([key, desc]) => (
                    <div key={key} className="text-xs">
                      <code className="bg-white px-2 py-1 rounded font-mono">
                        {`{{${key}}}`}
                      </code>
                      <span className="ml-2 text-muted-foreground">{desc}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
