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
import { Send, Copy, CheckCircle2, Mail, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  cotacaoId: string
  fornecedores: Array<{
    id: string
    razao_social: string
    nome_fantasia?: string
    email?: string
    telefone?: string
  }>
}

export default function EnviarLinksButton({ cotacaoId, fornecedores }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [enviandoEmails, setEnviandoEmails] = useState(false)
  const [enviandoIndividual, setEnviandoIndividual] = useState<string | null>(null)
  const [links, setLinks] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [emailsEnviados, setEmailsEnviados] = useState(false)

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
          // Usar link com query parameter (mais compatível com WhatsApp)
          novosLinks[fornecedor.id] =
            `${window.location.origin}/api/cotacao-fornecedor?token=${item.token_resposta}`
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

  const enviarEmails = async () => {
    setEnviandoEmails(true)
    try {
      const fornecedoresComEmail = fornecedores.filter((f) => f.email).map((f) => ({
        id: f.id,
        nome: f.nome_fantasia || f.razao_social,
        email: f.email,
        link: links[f.id],
      }))

      if (fornecedoresComEmail.length === 0) {
        alert('Nenhum fornecedor tem email cadastrado!')
        return
      }

      const response = await fetch('/api/cotacoes/enviar-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cotacaoId,
          fornecedores: fornecedoresComEmail,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setEmailsEnviados(true)
        alert(
          `✅ ${result.emailsEnviados} de ${result.total} emails enviados com sucesso!${
            result.erros ? `\n\n⚠️ Erros:\n${result.erros.join('\n')}` : ''
          }`
        )
      } else {
        throw new Error(result.error || 'Erro ao enviar emails')
      }
    } catch (err: any) {
      console.error('Erro ao enviar emails:', err)
      alert(`Erro ao enviar emails: ${err.message}`)
    } finally {
      setEnviandoEmails(false)
    }
  }

  const reenviarEmailIndividual = async (fornecedor: typeof fornecedores[0]) => {
    if (!fornecedor.email) {
      alert('Fornecedor não tem email cadastrado!')
      return
    }

    setEnviandoIndividual(fornecedor.id)
    try {
      const response = await fetch('/api/cotacoes/enviar-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cotacaoId,
          fornecedores: [
            {
              id: fornecedor.id,
              nome: fornecedor.nome_fantasia || fornecedor.razao_social,
              email: fornecedor.email,
              link: links[fornecedor.id],
            },
          ],
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`✅ E-mail reenviado com sucesso para ${fornecedor.email}`)
      } else {
        throw new Error(result.error || 'Erro ao reenviar email')
      }
    } catch (err: any) {
      console.error('Erro ao reenviar email:', err)
      alert(`Erro ao reenviar email: ${err.message}`)
    } finally {
      setEnviandoIndividual(null)
    }
  }

  const enviarWhatsAppIndividual = (fornecedor: typeof fornecedores[0]) => {
    if (!fornecedor.telefone) {
      alert('Fornecedor não tem telefone/WhatsApp cadastrado!')
      return
    }

    const link = links[fornecedor.id]
    if (!link) {
      alert('Link ainda não foi gerado!')
      return
    }

    // Debug: mostrar o link que será enviado
    console.log('🔗 Link gerado:', link)
    console.log('📱 Telefone:', fornecedor.telefone)

    // Limpar telefone (apenas números)
    const telefone = fornecedor.telefone.replace(/\D/g, '')

    if (telefone.length < 10) {
      alert('Número de telefone inválido!')
      return
    }

    // Formatar mensagem
    const nomeFornecedor = fornecedor.nome_fantasia || fornecedor.razao_social

    // SOLUÇÃO: Enviar link SIMPLES, sem formatação
    // O WhatsApp vai criar preview automaticamente do link
    const mensagem = `Olá ${nomeFornecedor}! Você foi convidado para uma cotação. Acesse: ${link}`

    console.log('📝 Mensagem original:', mensagem)

    // Codificar mensagem
    const mensagemCodificada = encodeURIComponent(mensagem)

    console.log('📝 Mensagem codificada:', mensagemCodificada)

    // Abrir WhatsApp
    const linkWhatsApp = `https://wa.me/55${telefone}?text=${mensagemCodificada}`

    console.log('🔗 Link WhatsApp completo:', linkWhatsApp)

    window.open(linkWhatsApp, '_blank')
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
                  {fornecedor.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reenviarEmailIndividual(fornecedor)}
                      disabled={enviandoIndividual === fornecedor.id}
                      className="gap-1"
                    >
                      <Mail className="h-4 w-4" />
                      {enviandoIndividual === fornecedor.id
                        ? 'Enviando...'
                        : 'E-mail'}
                    </Button>
                  )}
                  {fornecedor.telefone && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => enviarWhatsAppIndividual(fornecedor)}
                        className="gap-1 border-green-500 text-green-700 hover:bg-green-50"
                        title="Enviar mensagem automática (pode falhar em alguns dispositivos)"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {emailsEnviados && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  ✅ <strong>E-mails enviados com sucesso!</strong>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={enviarEmails}
                disabled={enviandoEmails}
                className="flex-1"
              >
                <Send className="mr-2 h-4 w-4" />
                {enviandoEmails
                  ? 'Enviando e-mails...'
                  : 'Enviar E-mails Automaticamente'}
              </Button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <p className="text-sm text-blue-900">
                <strong>💡 Dicas:</strong>
              </p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>Use <strong>"Enviar E-mails Automaticamente"</strong> para envio em massa</li>
                <li>Botão <strong>"WhatsApp"</strong> abre o app com mensagem pré-formatada</li>
                <li>Se o link não funcionar pelo WhatsApp, use <strong>"Copiar"</strong> e cole manualmente na conversa</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
