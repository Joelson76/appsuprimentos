/**
 * Helpers para acesso público com token (sem autenticação)
 * Usado em páginas de fornecedores para acessar cotações via link
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Setar token de cotação na sessão do Supabase
 * Permite queries públicas respeitando RLS
 *
 * @param token - Token único do item_cotacao
 */
export async function setPublicCotacaoToken(token: string) {
  const supabase = createClient()

  try {
    // Chamar função do Postgres que seta session variable
    const { error } = await supabase.rpc('set_cotacao_token', {
      p_token: token
    })

    if (error) {
      console.error('❌ Erro ao setar token:', error)
      return false
    }

    console.log('✅ Token setado na sessão:', token.substring(0, 8) + '...')
    return true
  } catch (err) {
    console.error('❌ Exceção ao setar token:', err)
    return false
  }
}

/**
 * Buscar cotação com token (acesso público)
 *
 * @param token - Token único do item_cotacao
 * @returns Dados da cotação ou null se inválido
 */
export async function fetchCotacaoByToken(token: string) {
  const supabase = createClient()

  // 1. Buscar item_cotacao pelo token
  const { data: itemData, error: itemError } = await supabase
    .from('itens_cotacao')
    .select('*')
    .eq('token_resposta', token)
    .single()

  if (itemError || !itemData) {
    console.error('❌ Token inválido:', itemError)
    return null
  }

  // 2. Setar token na sessão antes de buscar cotação
  await setPublicCotacaoToken(token)

  // 3. Agora buscar cotação (RLS vai permitir porque token está setado)
  const { data: cotacaoData, error: cotacaoError } = await supabase
    .from('cotacoes')
    .select('*')
    .eq('id', itemData.cotacao_id)
    .single()

  if (cotacaoError || !cotacaoData) {
    console.error('❌ Erro ao buscar cotação:', cotacaoError)
    return null
  }

  // 4. Buscar fornecedor
  const { data: fornecedorData } = await supabase
    .from('fornecedores')
    .select('razao_social, nome_fantasia, email, telefone')
    .eq('id', itemData.fornecedor_id)
    .single()

  // 5. Buscar todos itens desta cotação para este fornecedor
  const { data: itensData } = await supabase
    .from('itens_cotacao')
    .select('*')
    .eq('cotacao_id', itemData.cotacao_id)
    .eq('fornecedor_id', itemData.fornecedor_id)
    .order('created_at')

  return {
    cotacao: cotacaoData,
    fornecedor: fornecedorData,
    itens: itensData || [itemData],
    itemPrincipal: itemData,
  }
}

/**
 * Submeter resposta de cotação (acesso público)
 *
 * @param token - Token único do item_cotacao
 * @param respostas - Array de {item_id, valor_unitario, prazo_entrega, observacoes}
 * @param arquivo - Arquivo opcional de proposta
 * @returns true se sucesso
 */
export async function submitRespostaCotacao(
  token: string,
  respostas: Array<{
    item_id: string
    valor_unitario: number
    prazo_entrega: string
    observacoes?: string
  }>,
  arquivo?: File
) {
  const supabase = createClient()

  // 1. Setar token na sessão
  await setPublicCotacaoToken(token)

  // 2. Fazer upload do arquivo se fornecido
  let arquivoUrl = null
  if (arquivo) {
    const fileName = `${Date.now()}-${arquivo.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('propostas')
      .upload(fileName, arquivo)

    if (uploadError) {
      console.error('❌ Erro ao fazer upload:', uploadError)
      throw new Error('Erro ao fazer upload do arquivo')
    }

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from('propostas')
      .getPublicUrl(uploadData.path)

    arquivoUrl = urlData.publicUrl
  }

  // 3. Atualizar cada item com as respostas
  for (const resposta of respostas) {
    const updateData: any = {
      valor_unitario: resposta.valor_unitario,
      prazo_entrega: resposta.prazo_entrega,
      observacoes: resposta.observacoes || null,
      respondido_em: new Date().toISOString(),
    }

    if (arquivoUrl) {
      updateData.arquivo_proposta = arquivoUrl
    }

    const { error } = await supabase
      .from('itens_cotacao')
      .update(updateData)
      .eq('id', resposta.item_id)

    if (error) {
      console.error('❌ Erro ao atualizar item:', error)
      throw new Error('Erro ao salvar resposta')
    }
  }

  return true
}
