'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

interface EnviarWhatsAppButtonProps {
  pedido: {
    numero: string
    valor_total: number
    condicao_pagamento?: string
    observacoes?: string
    criado_em: string
  }
  fornecedor: {
    razao_social: string
    nome_fantasia?: string
    telefone?: string
  }
  itens: Array<{
    descricao: string
    quantidade: number
    valor_unitario: number
  }>
  empresa: {
    nome: string
    cnpj?: string
    telefone?: string
  }
}

export function EnviarWhatsAppButton({
  pedido,
  fornecedor,
  itens,
  empresa,
}: EnviarWhatsAppButtonProps) {
  const handleEnviar = () => {
    if (!fornecedor.telefone) {
      alert('Fornecedor não possui telefone/WhatsApp cadastrado!')
      return
    }

    // Limpar telefone (apenas números)
    const telefone = fornecedor.telefone.replace(/\D/g, '')

    if (telefone.length < 10) {
      alert('Número de telefone inválido!')
      return
    }

    // Formatar a mensagem
    const nomeEmpresa = empresa.nome
    const nomeFornecedor = fornecedor.nome_fantasia || fornecedor.razao_social

    let mensagem = `*📦 PEDIDO DE COMPRA*\n\n`
    mensagem += `*Número:* ${pedido.numero}\n`
    mensagem += `*Data:* ${new Date(pedido.criado_em).toLocaleDateString('pt-BR')}\n`
    mensagem += `*Empresa:* ${nomeEmpresa}\n`
    if (empresa.cnpj) {
      mensagem += `*CNPJ:* ${empresa.cnpj}\n`
    }
    if (empresa.telefone) {
      mensagem += `*Contato:* ${empresa.telefone}\n`
    }
    mensagem += `\n━━━━━━━━━━━━━━━━━━━━\n\n`

    mensagem += `Olá *${nomeFornecedor}*!\n\n`
    mensagem += `Segue o pedido de compra para sua empresa:\n\n`

    // Itens do pedido
    mensagem += `*ITENS DO PEDIDO:*\n\n`
    itens.forEach((item, idx) => {
      const valorTotal = item.valor_unitario * item.quantidade
      mensagem += `${idx + 1}. *${item.descricao}*\n`
      mensagem += `   Qtd: ${item.quantidade}\n`
      mensagem += `   Valor Unit.: R$ ${item.valor_unitario.toFixed(2)}\n`
      mensagem += `   Subtotal: R$ ${valorTotal.toFixed(2)}\n\n`
    })

    mensagem += `━━━━━━━━━━━━━━━━━━━━\n\n`
    mensagem += `*VALOR TOTAL:* R$ ${pedido.valor_total.toFixed(2)}\n\n`

    if (pedido.condicao_pagamento) {
      mensagem += `*Condição de Pagamento:*\n${pedido.condicao_pagamento}\n\n`
    }

    if (pedido.observacoes) {
      mensagem += `*Observações:*\n${pedido.observacoes}\n\n`
    }

    mensagem += `━━━━━━━━━━━━━━━━━━━━\n\n`
    mensagem += `⚠️ *IMPORTANTE:* Por favor, confirme o recebimento deste pedido e informe o prazo de entrega.\n\n`
    mensagem += `_Pedido gerado pelo sistema SupriFlow_`

    // Codificar mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem)

    // Gerar link do WhatsApp
    const linkWhatsApp = `https://wa.me/55${telefone}?text=${mensagemCodificada}`

    // Abrir WhatsApp
    window.open(linkWhatsApp, '_blank')
  }

  return (
    <Button
      onClick={handleEnviar}
      size="sm"
      variant="outline"
      className="gap-2 border-green-500 text-green-700 hover:bg-green-50"
    >
      <MessageCircle className="h-4 w-4" />
      Enviar via WhatsApp
    </Button>
  )
}
