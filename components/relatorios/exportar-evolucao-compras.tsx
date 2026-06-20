'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileSpreadsheet, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarEvolucaoCompras() {
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
        .from('vw_evolucao_compras_mensal')
        .select('*')
        .eq('tenant_id', profile?.tenant_id || '')
        .order('mes', { ascending: false })
        .limit(24)

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhum dado encontrado')
        return
      }

      const dadosExcel = data.map((item: any) => ({
        'Mês': item.mes,
        'Total de Pedidos': item.total_pedidos || 0,
        'Valor Total (R$)': Number(item.valor_total) || 0,
        'Valor Médio (R$)': Number(item.valor_medio) || 0,
        'Total de Requisições': item.total_requisicoes || 0,
      }))

      const ws = XLSX.utils.json_to_sheet(dadosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Evolução Mensal')

      XLSX.writeFile(wb, `evolucao-compras-${new Date().toISOString().split('T')[0]}.xlsx`)
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
        .from('vw_evolucao_compras_mensal')
        .select('*')
        .eq('tenant_id', profile?.tenant_id || '')
        .order('mes', { ascending: false })
        .limit(24)

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhum dado encontrado')
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
          <title>Evolução de Compras Mensal</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #667eea; color: white; }
            tr:hover { background-color: #f5f5f5; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Evolução de Compras Mensal</h1>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Total de Pedidos</th>
                <th>Valor Total</th>
                <th>Valor Médio</th>
                <th>Total de Requisições</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.mes}</td>
                  <td>${item.total_pedidos || 0}</td>
                  <td>R$ ${Number(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>R$ ${Number(item.valor_medio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>${item.total_requisicoes || 0}</td>
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
