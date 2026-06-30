'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileSpreadsheet, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarGastoCategoria() {
  const [loading, setLoading] = useState(false)
  const [loadingPrint, setLoadingPrint] = useState(false)

  const handleExportar = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      // Buscar tenant_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id || '')
        .single()

      const { data, error } = await supabase
        .from('vw_gasto_por_categoria')
        .select('*')
        .eq('tenant_id', profile?.tenant_id || '')
        .order('valor_total', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhum dado de categoria encontrado')
        return
      }

      const dadosExcel = data.map((categoria: any) => ({
        'Categoria': categoria.categoria_nome || 'Sem Categoria',
        'Total de Pedidos': categoria.total_pedidos || 0,
        'Valor Total (R$)': Number(categoria.valor_total) || 0,
      }))

      const ws = XLSX.utils.json_to_sheet(dadosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Gasto por Categoria')

      XLSX.writeFile(wb, `gasto-categoria-${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Relatório exportado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast.error(error.message || 'Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const handleImprimir = async () => {
    setLoadingPrint(true)
    try {
      const supabase = createClient()
      // Buscar tenant_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id || '')
        .single()

      const { data, error } = await supabase
        .from('vw_gasto_por_categoria')
        .select('*')
        .eq('tenant_id', profile?.tenant_id || '')
        .order('valor_total', { ascending: false })

      if (error) throw error
      if (!data || data.length === 0) {
        toast.error('Nenhum dado de categoria encontrado')
        return
      }

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Bloqueador de pop-ups ativado')
        return
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gasto por Categoria</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #667eea; color: white; }
            tr:hover { background-color: #f5f5f5; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Gasto por Categoria</h1>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Total Pedidos</th>
                <th>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(cat => `
                <tr>
                  <td>${cat.categoria_nome || 'Sem Categoria'}</td>
                  <td>${cat.total_pedidos || 0}</td>
                  <td>R$ ${Number(cat.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <br>
          <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir</button>
        </body>
        </html>
      `
      printWindow.document.write(html)
      printWindow.document.close()
      toast.success('Relatório aberto para impressão!')
    } catch (error: any) {
      console.error('Erro ao imprimir:', error)
      toast.error(error.message || 'Erro ao gerar relatório')
    } finally {
      setLoadingPrint(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleExportar}
        disabled={loading || loadingPrint}
        className="w-full"
      >
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
      <Button
        onClick={handleImprimir}
        disabled={loading || loadingPrint}
        variant="outline"
        className="w-full"
      >
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
