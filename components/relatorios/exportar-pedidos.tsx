'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarPedidos() {
  const [loading, setLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const handleExportar = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      let query = supabase
        .from('pedidos')
        .select(`
          *,
          fornecedor:fornecedores(razao_social, cnpj)
        `)
        .order('criado_em', { ascending: false })

      if (dataInicio) {
        query = query.gte('criado_em', dataInicio)
      }

      if (dataFim) {
        query = query.lte('criado_em', dataFim)
      }

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhum pedido encontrado no período')
        return
      }

      const dadosExcel = data.map((pedido: any) => ({
        Número: pedido.numero,
        Fornecedor: pedido.fornecedor?.razao_social || '-',
        CNPJ: pedido.fornecedor?.cnpj || '-',
        Status: pedido.status,
        'Valor Total': pedido.valor_total || 0,
        'Data Criação': new Date(pedido.criado_em).toLocaleDateString('pt-BR'),
        'Data Envio': pedido.enviado_em
          ? new Date(pedido.enviado_em).toLocaleDateString('pt-BR')
          : '-',
        'Data Recebimento': pedido.recebido_em
          ? new Date(pedido.recebido_em).toLocaleDateString('pt-BR')
          : '-',
      }))

      const ws = XLSX.utils.json_to_sheet(dadosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Pedidos')

      XLSX.writeFile(wb, `pedidos_${new Date().getTime()}.xlsx`)

      toast.success(`${data.length} pedido(s) exportado(s)!`)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao exportar pedidos')
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
