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
import { XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CancelarContratoButtonProps {
  contratoId: string
}

export function CancelarContratoButton({
  contratoId,
}: CancelarContratoButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancelar = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('contratos')
        .update({ status: 'CANCELADO' })
        .eq('id', contratoId)

      if (error) throw error

      toast.success('Contrato cancelado')
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao cancelar contrato:', error)
      toast.error(error.message || 'Erro ao cancelar contrato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={loading}>
          <XCircle className="mr-2 h-4 w-4" />
          Cancelar Contrato
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar Contrato?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação marcará o contrato como CANCELADO. Você pode reativá-lo
            posteriormente se necessário.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancelar}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Confirmar Cancelamento'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
