'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileSpreadsheet, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarBreakdownFiliais() {
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
        .from('vw_breakdown_por_filial')
        .select('*')
        .eq('tenant_id', profile?.tenant_id || '')
        .order('is_matriz', { ascending: false })
        .order('filial_nome')

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhuma filial encontrada')
        return
      }

      const dadosExcel = data.map((filial: any) => ({
        'Filial': filial.filial_nome,
        'CNPJ': filial.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || '',
        'Tipo': filial.is_matriz ? 'Matriz' : 'Filial',
        'Total Requisições': filial.total_requisicoes || 0,
        'Requisições Pendentes': filial.requisicoes_pendentes || 0,
        'Total Cotações': filial.total_cotacoes || 0,
        'Total Pedidos': filial.total_pedidos || 0,
        'Valor Total Pedidos (R$)': Number(filial.valor_pedidos) || 0,
      }))

      const ws = XLSX.utils.json_to_sheet(dadosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Breakdown Filiais')

      XLSX.writeFile(wb, `breakdown-filiais-${new Date().toISOString().split('T')[0]}.xlsx`)
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
        .from('vw_breakdown_por_filial')
        .select('*')
        .eq('tenant_id', profile?.tenant_id || '')
        .order('is_matriz', { ascending: false })
        .order('filial_nome')

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhuma filial encontrada')
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
          <title>Breakdown por Filial/CNPJ</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #667eea; color: white; }
            tr:hover { background-color: #f5f5f5; }
            .badge { background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Breakdown por Filial/CNPJ</h1>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          <table>
            <thead>
              <tr>
                <th>Filial</th>
                <th>CNPJ</th>
                <th>Tipo</th>
                <th>Requisições</th>
                <th>Pendentes</th>
                <th>Cotações</th>
                <th>Pedidos</th>
                <th>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(filial => `
                <tr>
                  <td>${filial.filial_nome}</td>
                  <td>${filial.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || ''}</td>
                  <td>${filial.is_matriz ? '<span class="badge">Matriz</span>' : 'Filial'}</td>
                  <td>${filial.total_requisicoes || 0}</td>
                  <td>${filial.requisicoes_pendentes || 0}</td>
                  <td>${filial.total_cotacoes || 0}</td>
                  <td>${filial.total_pedidos || 0}</td>
                  <td>R$ ${Number(filial.valor_pedidos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
