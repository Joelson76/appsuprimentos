// Edge Function para processar XML de NF-e e fazer 3-way matching
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const formData = await req.formData()
    const xmlFile = formData.get('xmlFile') as File
    const pedidoId = formData.get('pedidoId') as string
    const tenantId = formData.get('tenantId') as string

    if (!xmlFile || !pedidoId || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros incompletos' }),
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse do XML
    const xmlText = await xmlFile.text()
    const parser = new XMLParser({ ignoreAttributes: false })
    const parsed = parser.parse(xmlText)

    // Extrair dados da NF-e (estrutura padrão)
    const nfeRoot = parsed.nfeProc?.NFe?.infNFe || parsed.NFe?.infNFe

    if (!nfeRoot) {
      return new Response(
        JSON.stringify({ error: 'XML inválido ou formato não reconhecido' }),
        { status: 400 }
      )
    }

    const numero = nfeRoot.ide.nNF
    const serie = nfeRoot.ide.serie
    const chaveAcesso = nfeRoot['@_Id']?.replace('NFe', '') || ''
    const emissaoStr = nfeRoot.ide.dhEmi || nfeRoot.ide.dEmi
    const emissao = new Date(emissaoStr).toISOString().split('T')[0]
    const valorTotal = parseFloat(nfeRoot.total.ICMSTot.vNF)
    const cnpjEmitente = nfeRoot.emit.CNPJ

    // 3-way matching via função PostgreSQL
    const { data: matchingResult, error: matchingError } = await supabaseAdmin
      .rpc('verificar_matching', {
        p_pedido_id: pedidoId,
        p_numero_nf: numero,
        p_valor_nf: valorTotal,
        p_fornecedor_cnpj: cnpjEmitente,
      })

    if (matchingError) {
      console.error('Erro no matching:', matchingError)
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar matching' }),
        { status: 500 }
      )
    }

    const divergencias = matchingResult.divergencias || []
    const temDivergencias = divergencias.length > 0

    // Upload do XML para o Storage
    const timestamp = Date.now()
    const xmlPath = `${tenantId}/notas-fiscais/${timestamp}.xml`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documentos')
      .upload(xmlPath, xmlFile, {
        contentType: 'application/xml',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Erro ao fazer upload do XML' }),
        { status: 500 }
      )
    }

    // Inserir NF-e no banco
    const { data: notaFiscal, error: insertError } = await supabaseAdmin
      .from('notas_fiscais')
      .insert({
        tenant_id: tenantId,
        pedido_id: pedidoId,
        numero,
        serie,
        chave_acesso: chaveAcesso,
        emissao,
        valor_total: valorTotal,
        xml_path: xmlPath,
        divergencias: divergencias,
        status: temDivergencias ? 'DIVERGENTE' : 'CONFERIDA',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir NF:', insertError)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar nota fiscal' }),
        { status: 500 }
      )
    }

    // Se não há divergências, atualizar status da PO
    if (!temDivergencias) {
      await supabaseAdmin
        .from('ordens_compra')
        .update({ status: 'FATURADA' })
        .eq('id', pedidoId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        notaFiscal,
        temDivergencias,
        divergencias,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Erro ao processar NF-e:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar NF-e' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
