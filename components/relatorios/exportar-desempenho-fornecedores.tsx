'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileSpreadsheet, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarDesempenhoFornecedores() {
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
        .from('vw_desempenho_fornecedores')
        .select('*')
        .eq('tenant_id', profile?.tenant_id || '')
        .order('total_pedidos', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhum dado de desempenho encontrado')
        return
      }

      const dadosExcel = data.map((fornecedor: any) => ({
        'Fornecedor': fornecedor.razao_social || '-',
        'CNPJ': fornecedor.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || '',
        'Total de Pedidos': fornecedor.total_pedidos || 0,
        'Valor Total (R$)': Number(fornecedor.valor_total) || 0,
        'Valor Médio (R$)': Number(fornecedor.valor_medio) || 0,
        'Lead Time Médio (dias)': fornecedor.lead_time_medio_dias || 0,
        'Score': Number(fornecedor.score) || 0,
        'Pedidos no Prazo': fornecedor.pedidos_no_prazo || 0,
        '% Pontualidade': fornecedor.taxa_pontualidade ? `${Number(fornecedor.taxa_pontualidade).toFixed(1)}%` : '0%',
      }))

      const ws = XLSX.utils.json_to_sheet(dadosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Desempenho Fornecedores')

      XLSX.writeFile(wb, `desempenho-fornecedores-${new Date().toISOString().split('T')[0]}.xlsx`)
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
        .from('vw_desempenho_fornecedores')
        .select('*')
        .eq('tenant_id', profile?.tenant_id || '')
        .order('total_pedidos', { ascending: false })

      if (error) throw error
      if (!data || data.length === 0) {
        toast.error('Nenhum dado de desempenho encontrado')
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
          <title>Desempenho de Fornecedores</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 13px; }
            th { background-color: #667eea; color: white; }
            tr:hover { background-color: #f5f5f5; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Desempenho de Fornecedores</h1>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          <table>
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>CNPJ</th>
                <th>Pedidos</th>
                <th>Valor Total</th>
                <th>Valor Médio</th>
                <th>Lead Time</th>
                <th>Score</th>
                <th>No Prazo</th>
                <th>% Pontualidade</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(f => `
                <tr>
                  <td>${f.razao_social || '-'}</td>
                  <td>${f.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || ''}</td>
                  <td>${f.total_pedidos || 0}</td>
                  <td>R$ ${Number(f.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>R$ ${Number(f.valor_medio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>${f.lead_time_medio_dias || 0} dias</td>
                  <td>${Number(f.score || 0).toFixed(1)}</td>
                  <td>${f.pedidos_no_prazo || 0}</td>
                  <td>${f.taxa_pontualidade ? Number(f.taxa_pontualidade).toFixed(1) : 0}%</td>
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
