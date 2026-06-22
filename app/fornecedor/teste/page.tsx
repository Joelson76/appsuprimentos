'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function TesteLinkFornecedor() {
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
