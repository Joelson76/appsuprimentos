'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface DownloadDocumentoButtonProps {
  arquivoPath: string
  nomeContrato: string
}

export function DownloadDocumentoButton({
  arquivoPath,
  nomeContrato,
}: DownloadDocumentoButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      // Buscar URL pública do arquivo
      const { data, error } = await supabase.storage
        .from('documentos')
        .download(arquivoPath)

      if (error) throw error

      // Criar blob e fazer download
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url

      // Extrair nome do arquivo do path
      const fileName = arquivoPath.split('/').pop() || `contrato-${nomeContrato}.pdf`
      a.download = fileName

      document.body.appendChild(a)
      a.click()

      // Limpar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Download iniciado!')
    } catch (error: any) {
      console.error('Erro ao baixar documento:', error)
      toast.error(error.message || 'Erro ao baixar documento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Baixando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Baixar Documento
        </>
      )}
    </Button>
  )
}
