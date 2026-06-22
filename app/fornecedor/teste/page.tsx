'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function TesteLinkFornecedor() {
  const [token, setToken] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [testando, setTestando] = useState(false)

  const testarToken = async () => {
    if (!token) {
      alert('Digite um token para testar')
      return
    }

    setTestando(true)
    try {
      const response = await fetch(`/api/debug-token?token=${encodeURIComponent(token)}`)
      const data = await response.json()
      setResultado(data)
    } catch (error) {
      console.error('Erro ao testar:', error)
      alert('Erro ao testar token')
    } finally {
      setTestando(false)
    }
  }
  const testCases = [
    {
      titulo: 'Link normal (copiar/colar)',
      link: `${typeof window !== 'undefined' ? window.location.origin : ''}/fornecedor/abc123def456`,
      status: 'ok',
      descricao: 'Funciona ao copiar e colar diretamente'
    },
    {
      titulo: 'Link no WhatsApp Web',
      link: `https://wa.me/5511999999999?text=${encodeURIComponent('Teste: ' + (typeof window !== 'undefined' ? window.location.origin : '') + '/fornecedor/abc123')}`,
      status: 'warning',
      descricao: 'Pode quebrar se o link for muito longo ou tiver caracteres especiais'
    },
    {
      titulo: 'Link no WhatsApp App',
      link: 'whatsapp://send?text=teste',
      status: 'warning',
      descricao: 'Comportamento pode variar entre Android e iOS'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔍 Teste de Links para Fornecedor</CardTitle>
            <CardDescription>
              Use esta página para diagnosticar problemas com links de cotação
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🧪 Testar Token</CardTitle>
            <CardDescription>
              Cole um token de cotação para verificar se ele é válido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Token ou URL Completa:</label>
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole o token ou URL completa aqui"
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={testarToken} disabled={testando}>
              {testando ? 'Testando...' : 'Testar Token'}
            </Button>

            {resultado && (
              <div className="mt-4 space-y-4">
                <div className="bg-slate-100 p-4 rounded space-y-2">
                  <h3 className="font-semibold">📊 Informações do Token:</h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(resultado.debug, null, 2)}
                  </pre>
                </div>

                <div className="bg-slate-100 p-4 rounded space-y-2">
                  <h3 className="font-semibold">🔍 Resultados das Buscas:</h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(resultado.buscas, null, 2)}
                  </pre>
                </div>

                {resultado.buscas?.exato?.encontrado ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-900 font-medium">✅ Token válido encontrado!</p>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-900 font-medium">❌ Token não encontrado no banco</p>
                    {resultado.buscas?.similares?.quantidade > 0 && (
                      <p className="text-sm mt-2">
                        💡 Encontrados {resultado.buscas.similares.quantidade} tokens similares.
                        O token pode estar corrompido ou modificado.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {testCases.map((test, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {test.status === 'ok' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                  {test.status === 'warning' && <AlertCircle className="h-6 w-6 text-yellow-600" />}
                  {test.status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
                  <CardTitle className="text-lg">{test.titulo}</CardTitle>
                </div>
                <CardDescription>{test.descricao}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 p-3 rounded font-mono text-sm break-all">
                  {test.link}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>💡 Dicas de Solução</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <strong className="text-blue-900">✅ Método Recomendado:</strong>
              <p className="mt-2 text-blue-800">
                1. Copie o link diretamente do sistema<br />
                2. Abra o WhatsApp Web ou App<br />
                3. Cole o link na conversa com o fornecedor<br />
                4. Envie manualmente
              </p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <strong className="text-yellow-900">⚠️ Problema Comum:</strong>
              <p className="mt-2 text-yellow-800">
                Links muito longos podem ser quebrados pelo WhatsApp quando enviados
                automaticamente com texto formatado.
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <strong className="text-green-900">🔧 Solução Aplicada:</strong>
              <p className="mt-2 text-green-800">
                - Removida formatação excessiva (emojis decorativos, linhas)<br />
                - Link agora aparece em linha separada<br />
                - Mensagem simplificada para evitar quebra
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
