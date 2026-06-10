// Edge Function para buscar dados de CNPJ via ReceitaWS
// Evita problemas de CORS no browser

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const url = new URL(req.url)
    const cnpj = url.searchParams.get('cnpj')

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ não informado' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Remover formatação do CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, '')

    // Buscar na API da ReceitaWS
    const response = await fetch(
      `https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`
    )

    const data = await response.json()

    if (data.status === 'ERROR') {
      return new Response(
        JSON.stringify({ error: data.message || 'CNPJ não encontrado' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Transformar para o formato esperado
    const fornecedor = {
      razao_social: data.nome || '',
      nome_fantasia: data.fantasia || '',
      cnpj: cnpjLimpo,
      email: data.email || '',
      telefone: data.telefone || '',
      endereco: {
        cep: data.cep?.replace(/\D/g, '') || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.municipio || '',
        uf: data.uf || '',
      },
      situacao: data.situacao || '',
      atividade_principal: data.atividade_principal?.[0]?.text || '',
    }

    return new Response(JSON.stringify(fornecedor), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar CNPJ:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar dados do CNPJ' }),
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
