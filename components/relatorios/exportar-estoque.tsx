'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileSpreadsheet, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarEstoque() {
  const [loading, setLoading] = useState(false)
  const [loadingPrint, setLoadingPrint] = useState(false)

  const handleExportar = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(nome)')
        .order('descricao')

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhum produto encontrado')
        return
      }

      const dadosExcel = data.map((prod: any) => ({
        Código: prod.codigo || '-',
        Descrição: prod.descricao,
        Categoria: prod.categorias?.nome || '-',
        Unidade: prod.unidade,
        'Estoque Atual': prod.estoque_atual,
        'Estoque Mínimo': prod.estoque_minimo_alerta || '-',
        Localização: prod.localizacao || '-',
        Status: prod.ativo ? 'Ativo' : 'Inativo',
      }))

      const ws = XLSX.utils.json_to_sheet(dadosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Estoque')

      XLSX.writeFile(wb, `estoque_${new Date().getTime()}.xlsx`)

      toast.success(`${data.length} produto(s) exportado(s)!`)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao exportar estoque')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Posição atual de todos os produtos em estoque
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
          const { data, error } = await supabase.from('produtos').select('*').order('descricao')
          if (error) throw error
          if (!data || data.length === 0) { toast.error('Nenhum produto encontrado'); return }
          const printWindow = window.open('', '_blank')
          if (!printWindow) { toast.error('Bloqueador de pop-ups ativado'); return }
          printWindow.document.write(`<!DOCTYPE html><html><head><title>Estoque</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#333}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;font-size:12px}th{background-color:#667eea;color:white}@media print{button{display:none}}</style></head><body><h1>Relatório de Estoque</h1><p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p><table><thead><tr><th>Produto</th><th>Código</th><th>Estoque Atual</th><th>Estoque Mínimo</th><th>Unidade</th></tr></thead><tbody>${data.map(p => `<tr><td>${p.descricao}</td><td>${p.codigo || '-'}</td><td>${p.estoque_atual || 0}</td><td>${p.estoque_minimo_alerta || 0}</td><td>${p.unidade || '-'}</td></tr>`).join('')}</tbody></table><br><button onclick="window.print()" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:4px;cursor:pointer">Imprimir</button></body></html>`)
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
