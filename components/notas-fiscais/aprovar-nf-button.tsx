'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AprovarNFButtonProps {
  nfId: string
}

export function AprovarNFButton({ nfId }: AprovarNFButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAprovar = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('notas_fiscais')
        .update({ status: 'APROVADA' })
        .eq('id', nfId)

      if (error) throw error

      toast.success('Nota fiscal aprovada com sucesso!')
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao aprovar NF:', error)
      toast.error(error.message || 'Erro ao aprovar nota fiscal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" disabled={loading}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Aprovar NF-e
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Aprovar Nota Fiscal?</AlertDialogTitle>
          <AlertDialogDescription>
            Ao aprovar esta NF-e, você confirma que todos os dados estão corretos
            e em conformidade com o pedido de compra e recebimento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleAprovar} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aprovando...
              </>
            ) : (
              'Confirmar Aprovação'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
