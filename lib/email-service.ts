/**
 * Serviço de Envio de E-mails com Templates
 *
 * Integração com Resend + Templates personalizáveis do banco de dados
 */

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export type TipoTemplateEmail =
  | 'COTACAO_ENVIADA'
  | 'COTACAO_RESPONDIDA'
  | 'PEDIDO_CRIADO'
  | 'PEDIDO_APROVADO'
  | 'PEDIDO_CANCELADO'
  | 'ESTOQUE_BAIXO'
  | 'REQUISICAO_CRIADA'
  | 'REQUISICAO_APROVADA'
  | 'REQUISICAO_REJEITADA'
  | 'CONVITE_USUARIO'
  | 'BEM_VINDO'
  | 'FATURA_GERADA'
  | 'FATURA_VENCIDA'
  | 'ASSINATURA_CANCELADA'

export interface EnviarEmailComTemplateParams {
  tipo: TipoTemplateEmail
  para: string | string[]
  variaveis: Record<string, string>
  tenantId: string
  cc?: string[]
  bcc?: string[]
  anexos?: Array<{
    filename: string
    content: Buffer | string
  }>
}

/**
 * Substitui variáveis no formato {{variavel}} por seus valores
 */
function substituirVariaveis(
  texto: string,
  variaveis: Record<string, string>
): string {
  let resultado = texto

  Object.entries(variaveis).forEach(([chave, valor]) => {
    const regex = new RegExp(`{{${chave}}}`, 'g')
    resultado = resultado.replace(regex, valor)
  })

  return resultado
}

/**
 * Busca template ativo do banco de dados
 */
async function buscarTemplate(tipo: TipoTemplateEmail, tenantId: string) {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('tipo', tipo)
    .eq('ativo', true)
    .single()

  if (error || !template) {
    throw new Error(
      `Template não encontrado ou inativo: ${tipo} (tenant: ${tenantId})`
    )
  }

  return template
}

/**
 * Envia e-mail usando template personalizado do tenant
 */
export async function enviarEmailComTemplate({
  tipo,
  para,
  variaveis,
  tenantId,
  cc,
  bcc,
  anexos,
}: EnviarEmailComTemplateParams) {
  try {
    // 1. Buscar template
    const template = await buscarTemplate(tipo, tenantId)

    // 2. Substituir variáveis no assunto
    const assunto = substituirVariaveis(template.assunto, variaveis)

    // 3. Substituir variáveis no corpo HTML
    const corpoHtml = substituirVariaveis(template.corpo_html, variaveis)

    // 4. Substituir variáveis no corpo texto (se existir)
    const corpoTexto = template.corpo_texto
      ? substituirVariaveis(template.corpo_texto, variaveis)
      : undefined

    // 5. Preparar destinatários
    const destinatarios = Array.isArray(para) ? para : [para]

    // 6. Enviar via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SupriFlow <noreply@supriflow.com.br>',
      to: destinatarios,
      cc,
      bcc,
      subject: assunto,
      html: corpoHtml,
      text: corpoTexto,
      attachments: anexos,
    })

    if (error) {
      console.error('Erro ao enviar e-mail:', error)
      throw new Error(`Falha ao enviar e-mail: ${error.message}`)
    }

    console.log('✅ E-mail enviado com sucesso:', {
      id: data?.id,
      tipo,
      para: destinatarios,
    })

    return {
      success: true,
      messageId: data?.id,
      assunto,
    }
  } catch (error: any) {
    console.error('Erro em enviarEmailComTemplate:', error)
    throw error
  }
}

/**
 * Envia e-mail simples (sem template do banco)
 */
export async function enviarEmail({
  para,
  assunto,
  html,
  texto,
  cc,
  bcc,
  anexos,
}: {
  para: string | string[]
  assunto: string
  html: string
  texto?: string
  cc?: string[]
  bcc?: string[]
  anexos?: Array<{
    filename: string
    content: Buffer | string
  }>
}) {
  try {
    const destinatarios = Array.isArray(para) ? para : [para]

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SupriFlow <noreply@supriflow.com.br>',
      to: destinatarios,
      cc,
      bcc,
      subject: assunto,
      html,
      text: texto,
      attachments: anexos,
    })

    if (error) {
      throw new Error(`Falha ao enviar e-mail: ${error.message}`)
    }

    console.log('✅ E-mail enviado:', {
      id: data?.id,
      para: destinatarios,
      assunto,
    })

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error)
    throw error
  }
}

/**
 * Helpers específicos para cada tipo de e-mail
 */

export async function enviarCotacaoParaFornecedor({
  tenantId,
  emailFornecedor,
  nomeFornecedor,
  nomeEmpresa,
  numeroCotacao,
  totalItens,
  prazoResposta,
}: {
  tenantId: string
  emailFornecedor: string
  nomeFornecedor: string
  nomeEmpresa: string
  numeroCotacao: string
  totalItens: number
  prazoResposta: string
}) {
  return enviarEmailComTemplate({
    tipo: 'COTACAO_ENVIADA',
    para: emailFornecedor,
    tenantId,
    variaveis: {
      nome_empresa: nomeEmpresa,
      numero_cotacao: numeroCotacao,
      fornecedor_nome: nomeFornecedor,
      total_itens: totalItens.toString(),
      prazo_resposta: prazoResposta,
    },
  })
}

export async function enviarPedidoParaFornecedor({
  tenantId,
  emailFornecedor,
  nomeFornecedor,
  nomeEmpresa,
  numeroPedido,
  valorTotal,
  prazoEntrega,
}: {
  tenantId: string
  emailFornecedor: string
  nomeFornecedor: string
  nomeEmpresa: string
  numeroPedido: string
  valorTotal: string
  prazoEntrega: string
}) {
  return enviarEmailComTemplate({
    tipo: 'PEDIDO_CRIADO',
    para: emailFornecedor,
    tenantId,
    variaveis: {
      nome_empresa: nomeEmpresa,
      numero_pedido: numeroPedido,
      fornecedor_nome: nomeFornecedor,
      valor_total: valorTotal,
      prazo_entrega: prazoEntrega,
    },
  })
}

export async function enviarAlertaEstoqueBaixo({
  tenantId,
  emailsDestinatarios,
  nomeEmpresa,
  produtoNome,
  estoqueAtual,
  estoqueMinimo,
}: {
  tenantId: string
  emailsDestinatarios: string[]
  nomeEmpresa: string
  produtoNome: string
  estoqueAtual: string
  estoqueMinimo: string
}) {
  return enviarEmailComTemplate({
    tipo: 'ESTOQUE_BAIXO',
    para: emailsDestinatarios,
    tenantId,
    variaveis: {
      nome_empresa: nomeEmpresa,
      produto_nome: produtoNome,
      estoque_atual: estoqueAtual,
      estoque_minimo: estoqueMinimo,
    },
  })
}

export async function enviarBoasVindas({
  tenantId,
  emailUsuario,
  nomeUsuario,
  nomeEmpresa,
}: {
  tenantId: string
  emailUsuario: string
  nomeUsuario: string
  nomeEmpresa: string
}) {
  return enviarEmailComTemplate({
    tipo: 'BEM_VINDO',
    para: emailUsuario,
    tenantId,
    variaveis: {
      nome_empresa: nomeEmpresa,
      usuario_nome: nomeUsuario,
      email: emailUsuario,
    },
  })
}

export async function enviarFaturaGerada({
  tenantId,
  emailEmpresa,
  nomeEmpresa,
  valor,
  vencimento,
  linkPagamento,
}: {
  tenantId: string
  emailEmpresa: string
  nomeEmpresa: string
  valor: string
  vencimento: string
  linkPagamento: string
}) {
  return enviarEmailComTemplate({
    tipo: 'FATURA_GERADA',
    para: emailEmpresa,
    tenantId,
    variaveis: {
      nome_empresa: nomeEmpresa,
      valor,
      vencimento,
      link_pagamento: linkPagamento,
    },
  })
}
