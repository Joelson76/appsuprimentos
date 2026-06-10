// Edge Function para upload de contrato (PDF)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const pdfFile = formData.get('pdfFile') as File
    const contratoId = formData.get('contratoId') as string
    const tenantId = formData.get('tenantId') as string

    if (!pdfFile || !contratoId || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros incompletos' }),
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!pdfFile.type.includes('pdf')) {
      return new Response(
        JSON.stringify({ error: 'Apenas arquivos PDF são permitidos' }),
        { status: 400 }
      )
    }

    // Validar tamanho (máx 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (pdfFile.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande (máx 10MB)' }),
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload do PDF para o Storage
    const pdfPath = `${tenantId}/contratos/${contratoId}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documentos')
      .upload(pdfPath, pdfFile, {
        contentType: 'application/pdf',
        upsert: true, // Permite substituir arquivo existente
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Erro ao fazer upload do arquivo' }),
        { status: 500 }
      )
    }

    // Atualizar registro do contrato com o path
    const { data: contrato, error: updateError } = await supabaseAdmin
      .from('contratos')
      .update({ arquivo_path: pdfPath })
      .eq('id', contratoId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar contrato:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar contrato' }),
        { status: 500 }
      )
    }

    // Gerar URL assinada (válida por 1 hora)
    const { data: signedUrl } = await supabaseAdmin.storage
      .from('documentos')
      .createSignedUrl(pdfPath, 3600)

    return new Response(
      JSON.stringify({
        success: true,
        contrato,
        downloadUrl: signedUrl?.signedUrl,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao fazer upload' }),
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
