'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileSpreadsheet, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarFornecedores() {
  const [loading, setLoading] = useState(false)
  const [loadingPrint, setLoadingPrint] = useState(false)

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

      <Button onClick={handleExportar} disabled={loading || loadingPrint} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar Excel
          </>
        )}
      </Button>

      <Button onClick={async () => {
        setLoadingPrint(true)
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('fornecedores').select('*').order('razao_social')
          if (error) throw error
          if (!data || data.length === 0) { toast.error('Nenhum fornecedor encontrado'); return }
          const printWindow = window.open('', '_blank')
          if (!printWindow) { toast.error('Bloqueador de pop-ups ativado'); return }
          printWindow.document.write(`<!DOCTYPE html><html><head><title>Fornecedores</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#333}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;font-size:12px}th{background-color:#667eea;color:white}@media print{button{display:none}}</style></head><body><h1>Relatório de Fornecedores</h1><p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p><table><thead><tr><th>Razão Social</th><th>CNPJ</th><th>Email</th><th>Telefone</th><th>Status</th></tr></thead><tbody>${data.map(f => `<tr><td>${f.razao_social}</td><td>${f.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || ''}</td><td>${f.email || '-'}</td><td>${f.telefone || '-'}</td><td>${f.status}</td></tr>`).join('')}</tbody></table><br><button onclick="window.print()" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:4px;cursor:pointer">Imprimir</button></body></html>`)
          printWindow.document.close()
          toast.success('Relatório aberto para impressão!')
        } catch (error: any) {
          toast.error(error.message || 'Erro ao gerar relatório')
        } finally {
          setLoadingPrint(false)
        }
      }} disabled={loading || loadingPrint} variant="outline" className="w-full">
        {loadingPrint ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparando...
          </>
        ) : (
          <>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </>
        )}
      </Button>
    </div>
  )
}
