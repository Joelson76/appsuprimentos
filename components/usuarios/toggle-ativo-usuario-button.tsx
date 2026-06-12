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
} from '@/components/ui/alert-dialog'
import { Loader2, Ban, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  usuarioId: string
  ativo: boolean
}

export function ToggleAtivoUsuarioButton({ usuarioId, ativo }: Props) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({ ativo: !ativo })
        .eq('id', usuarioId)

      if (error) throw error

      toast.success(ativo ? 'Usuário desativado' : 'Usuário ativado')
      setShowDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao alterar status do usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={ativo ? 'ghost' : 'default'}
        size="sm"
        onClick={() => setShowDialog(true)}
      >
        {ativo ? (
          <>
            <Ban className="mr-1 h-4 w-4" />
            Desativar
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Ativar
          </>
        )}
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {ativo
                ? 'O usuário perderá acesso ao sistema. Você pode reativá-lo a qualquer momento.'
                : 'O usuário voltará a ter acesso ao sistema.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
