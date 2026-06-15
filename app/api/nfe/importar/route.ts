import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'
import crypto from 'crypto'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { xml_content } = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Parse XML
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const nfe = parser.parse(xml_content)

    // Navega na estrutura da NF-e
    const infNFe = nfe.nfeProc?.NFe?.infNFe || nfe.NFe?.infNFe
    if (!infNFe) {
      return NextResponse.json({ error: 'XML inválido - não encontrado infNFe' }, { status: 400 })
    }

    const chaveAcesso = infNFe['@_Id']?.replace('NFe', '') || ''
    const ide = infNFe.ide
    const emit = infNFe.emit
    const total = infNFe.total?.ICMSTot
    const det = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det]

    // Extrai dados
    const nfeData = {
      chave_acesso: chaveAcesso,
      numero_nfe: ide.nNF,
      serie: ide.serie,
      data_emissao: ide.dhEmi ? ide.dhEmi.split('T')[0] : ide.dEmi,
      fornecedor_cnpj: emit.CNPJ,
      fornecedor_nome: emit.xNome,
      valor_produtos: parseFloat(total.vProd),
      valor_total: parseFloat(total.vNF),
      valor_icms: parseFloat(total.vICMS || 0),
      valor_ipi: parseFloat(total.vIPI || 0),
    }

    // Extrai itens
    const itens = det.map((item: any) => {
      const prod = item.prod
      return {
        codigo: prod.cProd,
        descricao: prod.xProd,
        ncm: prod.NCM,
        unidade: prod.uCom,
        quantidade: parseFloat(prod.qCom),
        preco_unitario: parseFloat(prod.vUnCom),
        valor_total: parseFloat(prod.vProd)
      }
    })

    // Hash do XML
    const xmlHash = crypto.createHash('sha256').update(xml_content).digest('hex')

    // Verifica se já foi importado
    const { data: existente } = await supabase
      .from('nfe_importadas')
      .select('id')
      .eq('chave_acesso', chaveAcesso)
      .single()

    if (existente) {
      return NextResponse.json({ error: 'NF-e já foi importada anteriormente' }, { status: 400 })
    }

    // Insere NF-e importada
    const { data: nfeImportada, error: insertError } = await supabaseAdmin
      .from('nfe_importadas')
      .insert({
        tenant_id: profile.tenant_id,
        ...nfeData,
        itens: itens,
        xml_content,
        xml_hash,
        importado_por: user.id
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Processa a NF-e (cria fornecedor + nota fiscal)
    const { data: resultado, error: processError } = await supabaseAdmin.rpc(
      'processar_nfe_importada',
      { p_nfe_importada_id: nfeImportada.id }
    )

    if (processError) {
      return NextResponse.json({ error: processError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      nfe_importada: nfeImportada,
      resultado
    })
  } catch (error: any) {
    console.error('Erro ao importar NF-e:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
