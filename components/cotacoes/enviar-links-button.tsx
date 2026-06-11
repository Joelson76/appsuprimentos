'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Send, Copy, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  cotacaoId: string
  fornecedores: Array<{
    id: string
    razao_social: string
    nome_fantasia?: string
    email?: string
  }>
}

export default function EnviarLinksButton({ cotacaoId, fornecedores }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [links, setLinks] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const gerarLinks = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const novosLinks: Record<string, string> = {}

      for (const fornecedor of fornecedores) {
        // Buscar o token_resposta de um dos itens deste fornecedor nesta cotação
        const { data: item } = await supabase
          .from('itens_cotacao')
          .select('token_resposta')
          .eq('cotacao_id', cotacaoId)
          .eq('fornecedor_id', fornecedor.id)
          .limit(1)
          .single()

        if (item?.token_resposta) {
          novosLinks[fornecedor.id] =
            `${window.location.origin}/fornecedor/${item.token_resposta}`
        }
      }

      setLinks(novosLinks)
      setOpen(true)
      router.refresh()
    } catch (err) {
      console.error('Erro ao gerar links:', err)
      alert('Erro ao gerar links')
    } finally {
      setLoading(false)
    }
  }

  const copiarLink = (fornecedorId: string) => {
    navigator.clipboard.writeText(links[fornecedorId])
    setCopied(fornecedorId)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <Button onClick={gerarLinks} disabled={loading}>
        <Send className="mr-2 h-4 w-4" />
        {loading ? 'Gerando...' : 'Enviar para Fornecedores'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Links para Fornecedores</DialogTitle>
            <DialogDescription>
              Compartilhe estes links com os fornecedores via e-mail ou WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {fornecedores.map((fornecedor) => (
              <div
                key={fornecedor.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="font-medium">
                  {fornecedor.nome_fantasia || fornecedor.razao_social}
                </div>
                {fornecedor.email && (
                  <div className="text-sm text-muted-foreground">
                    {fornecedor.email}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={links[fornecedor.id] || 'Gerando...'}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-slate-50 font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copiarLink(fornecedor.id)}
                  >
                    {copied === fornecedor.id ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Dica:</strong> Envie os links por e-mail ou WhatsApp.
              Cada fornecedor receberá um link único e seguro para preencher sua
              proposta.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
