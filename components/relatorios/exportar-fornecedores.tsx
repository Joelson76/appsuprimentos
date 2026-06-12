'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarFornecedores() {
  const [loading, setLoading] = useState(false)

  const handleExportar = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('razao_social')

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhum fornecedor encontrado')
        return
      }

      const dadosExcel = data.map((forn: any) => ({
        'Razão Social': forn.razao_social,
        'Nome Fantasia': forn.nome_fantasia || '-',
        CNPJ: forn.cnpj,
        Email: forn.email || '-',
        Telefone: forn.telefone || '-',
        Cidade: forn.cidade || '-',
        Estado: forn.estado || '-',
        Status: forn.ativo ? 'Ativo' : 'Inativo',
        'Data Cadastro': new Date(forn.criado_em).toLocaleDateString('pt-BR'),
      }))

      const ws = XLSX.utils.json_to_sheet(dadosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Fornecedores')

      XLSX.writeFile(wb, `fornecedores_${new Date().getTime()}.xlsx`)

      toast.success(`${data.length} fornecedor(es) exportado(s)!`)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao exportar fornecedores')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Exportar todos os fornecedores cadastrados
      </p>

      <Button onClick={handleExportar} disabled={loading} className="w-full">
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Exportar Excel
      </Button>
    </div>
  )
}
