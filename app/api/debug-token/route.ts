import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Buscar o token exatamente como está
    const { data: itemExato, error: erroExato } = await supabase
      .from('itens_cotacao')
      .select('id, token_resposta, cotacao_id, fornecedor_id')
      .eq('token_resposta', token)
      .limit(1)
      .single()

    // Buscar token com trim
    const tokenTrim = token.trim()
    const { data: itemTrim, error: erroTrim } = await supabase
      .from('itens_cotacao')
      .select('id, token_resposta, cotacao_id, fornecedor_id')
      .eq('token_resposta', tokenTrim)
      .limit(1)
      .single()

    // Buscar tokens que começam com os primeiros caracteres
    const primeiros10 = token.substring(0, 10)
    const { data: itensSimilares, error: erroSimilares } = await supabase
      .from('itens_cotacao')
      .select('id, token_resposta')
      .like('token_resposta', `${primeiros10}%`)
      .limit(5)

    return NextResponse.json({
      debug: {
        tokenRecebido: token,
        tamanho: token.length,
        temEspacos: token.includes(' '),
        primeiros10Chars: primeiros10,
        ultimos10Chars: token.substring(token.length - 10),
      },
      buscas: {
        exato: {
          encontrado: !!itemExato,
          erro: erroExato?.message,
          item: itemExato,
        },
        comTrim: {
          encontrado: !!itemTrim,
          erro: erroTrim?.message,
          item: itemTrim,
        },
        similares: {
          quantidade: itensSimilares?.length || 0,
          tokens: itensSimilares?.map(i => ({
            id: i.id,
            token: i.token_resposta,
            tamanho: i.token_resposta?.length,
          })),
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
