'use client'

import { useState } from 'react'
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
} from '@/components/ui/alert-dialog'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  faturaId: string
}

export function MarcarPagaButton({ faturaId }: Props) {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('faturas')
        .update({
          status: 'PAGO',
          pagamento_em: new Date().toISOString().split('T')[0],
        })
        .eq('id', faturaId)

      if (error) throw error

      toast.success('Fatura marcada como paga!')
      router.refresh()
      setShowDialog(false)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao marcar fatura como paga')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Marcar como Paga
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar esta fatura como paga? Esta ação
              confirmará o recebimento do pagamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
