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
import { Loader2, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarRequisicoes() {
  const [loading, setLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [status, setStatus] = useState('TODOS')

  const handleExportar = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      let query = supabase
        .from('requisicoes')
        .select(`
          *,
          solicitante:profiles!requisicoes_solicitante_id_fkey(nome),
          aprovador:profiles!requisicoes_aprovador_id_fkey(nome)
        `)
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
        Solicitante: req.solicitante?.nome || '-',
        'Centro de Custo': req.centro_custo || '-',
        Status: req.status,
        'Valor Total': req.valor_total || 0,
        Aprovador: req.aprovador?.nome || '-',
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
