'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ExportarEstoque() {
  const [loading, setLoading] = useState(false)

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
