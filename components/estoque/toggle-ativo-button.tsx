'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  categoriaId: string
  ativo: boolean
}

export function ToggleAtivoButton({ categoriaId, ativo }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('categorias')
        .update({ ativo: !ativo })
        .eq('id', categoriaId)

      if (error) throw error

      toast.success(ativo ? 'Categoria desativada' : 'Categoria ativada')
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao alterar status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={ativo ? 'ghost' : 'default'}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : ativo ? (
        <>
          <XCircle className="mr-1 h-4 w-4" />
          Desativar
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Ativar
        </>
      )}
    </Button>
  )
}
