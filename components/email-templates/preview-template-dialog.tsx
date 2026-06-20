'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PreviewTemplateDialogProps {
  template: any
  trigger: React.ReactNode
}

export function PreviewTemplateDialog({
  template,
  trigger,
}: PreviewTemplateDialogProps) {
  const [open, setOpen] = useState(false)

  // Dados de exemplo para substituir as variáveis
  const dadosExemplo: Record<string, any> = {
    nome_empresa: 'Empresa Exemplo LTDA',
    numero_cotacao: 'COT-2026-0042',
    numero_pedido: 'PO-2026-0015',
    numero_requisicao: 'REQ-2026-0089',
    fornecedor_nome: 'Fornecedor XYZ',
    valor_total: 'R$ 15.450,00',
    total_itens: '12',
    prazo_resposta: '5 dias',
    prazo_entrega: '15 dias',
    produto_nome: 'Parafuso M8',
    estoque_atual: '10 unidades',
    estoque_minimo: '50 unidades',
    solicitante_nome: 'João Silva',
    usuario_nome: 'Maria Santos',
    email: 'maria@exemplo.com',
    perfil: 'Comprador',
    link_aceite: 'https://app.exemplo.com/aceitar/abc123',
    valor: 'R$ 199,00',
    vencimento: '30/06/2026',
    link_pagamento: 'https://app.exemplo.com/pagar/xyz789',
  }

  // Substituir variáveis no texto
  const substituirVariaveis = (texto: string) => {
    let resultado = texto

    // Substituir todas as variáveis {{variavel}}
    Object.entries(dadosExemplo).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      resultado = resultado.replace(regex, String(value))
    })

    return resultado
  }

  const assuntoPreview = substituirVariaveis(template.assunto)
  const corpoHtmlPreview = substituirVariaveis(template.corpo_html || '')
  const corpoTextoPreview = substituirVariaveis(template.corpo_texto || '')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Preview do Template</DialogTitle>
          <DialogDescription>{template.nome}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assunto */}
          <div className="p-4 bg-slate-50 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">ASSUNTO</p>
            <p className="font-semibold">{assuntoPreview}</p>
          </div>

          {/* Corpo */}
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="html">Visualização HTML</TabsTrigger>
              <TabsTrigger value="codigo">Código HTML</TabsTrigger>
              {template.corpo_texto && (
                <TabsTrigger value="texto">Texto Puro</TabsTrigger>
              )}
            </TabsList>

            <TabsContent
              value="html"
              className="border rounded-lg p-6 bg-white max-h-[500px] overflow-auto"
            >
              <div
                dangerouslySetInnerHTML={{ __html: corpoHtmlPreview }}
                className="prose max-w-none"
              />
            </TabsContent>

            <TabsContent
              value="codigo"
              className="border rounded-lg p-4 bg-slate-900 max-h-[500px] overflow-auto"
            >
              <pre className="text-sm text-slate-100 font-mono">
                <code>{corpoHtmlPreview}</code>
              </pre>
            </TabsContent>

            {template.corpo_texto && (
              <TabsContent
                value="texto"
                className="border rounded-lg p-6 bg-white max-h-[500px] overflow-auto"
              >
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {corpoTextoPreview}
                </pre>
              </TabsContent>
            )}
          </Tabs>

          {/* Variáveis usadas */}
          {template.variaveis_disponiveis && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-2">
                💡 DADOS DE EXEMPLO (as variáveis serão substituídas com dados
                reais)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(template.variaveis_disponiveis).map(
                  ([key, desc]: any) => (
                    <div key={key} className="text-xs text-blue-800">
                      <code className="bg-white px-2 py-0.5 rounded font-mono text-xs">
                        {`{{${key}}}`}
                      </code>
                      <span className="ml-2">
                        → {dadosExemplo[key] || '(sem valor)'}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
