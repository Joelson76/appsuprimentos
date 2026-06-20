'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, FileSpreadsheet, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarRequisicoes() {
  const [loading, setLoading] = useState(false)
  const [loadingPrint, setLoadingPrint] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [status, setStatus] = useState('TODOS')

  const handleExportar = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      let query = supabase
        .from('requisicoes')
        .select('*')
        .order('criado_em', { ascending: false })

      if (dataInicio) {
        query = query.gte('criado_em', dataInicio)
      }

      if (dataFim) {
        query = query.lte('criado_em', dataFim)
      }

      if (status !== 'TODOS') {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhuma requisição encontrada no período')
        return
      }

      // Formatar dados para Excel
      const dadosExcel = data.map((req: any) => ({
        Número: req.numero,
        'Centro de Custo': req.centro_custo || '-',
        Status: req.status,
        'Valor Total': req.valor_total || 0,
        'Data Criação': new Date(req.criado_em).toLocaleDateString('pt-BR'),
        'Data Aprovação': req.aprovado_em
          ? new Date(req.aprovado_em).toLocaleDateString('pt-BR')
          : '-',
        Observações: req.observacoes || '-',
      }))

      // Criar workbook
      const ws = XLSX.utils.json_to_sheet(dadosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Requisições')

      // Download
      XLSX.writeFile(wb, `requisicoes_${new Date().getTime()}.xlsx`)

      toast.success(`${data.length} requisição(ões) exportada(s)!`)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao exportar requisições')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Data Início</Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label>Data Fim</Label>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus} disabled={loading}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="APROVADO">Aprovado</SelectItem>
            <SelectItem value="REPROVADO">Reprovado</SelectItem>
            <SelectItem value="CANCELADO">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
          let query = supabase.from('requisicoes').select('*').order('criado_em', { ascending: false })
          if (dataInicio) query = query.gte('criado_em', dataInicio)
          if (dataFim) query = query.lte('criado_em', dataFim)
          if (status !== 'TODOS') query = query.eq('status', status)
          const { data, error } = await query
          if (error) throw error
          if (!data || data.length === 0) { toast.error('Nenhuma requisição encontrada'); return }
          const printWindow = window.open('', '_blank')
          if (!printWindow) { toast.error('Bloqueador de pop-ups ativado'); return }
          printWindow.document.write(`<!DOCTYPE html><html><head><title>Requisições</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#333}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;font-size:12px}th{background-color:#667eea;color:white}@media print{button{display:none}}</style></head><body><h1>Relatório de Requisições</h1><p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p><table><thead><tr><th>Número</th><th>Status</th><th>Valor</th><th>Data</th></tr></thead><tbody>${data.map(r => `<tr><td>${r.numero}</td><td>${r.status}</td><td>R$ ${(r.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td>${new Date(r.criado_em).toLocaleDateString('pt-BR')}</td></tr>`).join('')}</tbody></table><br><button onclick="window.print()" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:4px;cursor:pointer">Imprimir</button></body></html>`)
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
