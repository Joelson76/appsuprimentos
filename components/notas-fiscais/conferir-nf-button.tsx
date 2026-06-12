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
import { FileCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ConferirNFButtonProps {
  nfId: string
}

export function ConferirNFButton({ nfId }: ConferirNFButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleConferir = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/notas-fiscais/conferir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao conferir NF')
      }

      if (data.divergencias && data.divergencias.length > 0) {
        toast.warning(data.message, {
          description: `${data.divergencias.length} divergência(s) identificada(s)`,
        })
      } else {
        toast.success(data.message)
      }

      router.refresh()
    } catch (error: any) {
      console.error('Erro ao conferir NF:', error)
      toast.error(error.message || 'Erro ao conferir nota fiscal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={loading}>
          <FileCheck className="mr-2 h-4 w-4" />
          Conferir Automaticamente
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Conferir Nota Fiscal?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              O sistema irá realizar uma conferência automática (3-way matching)
              comparando:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Valores da NF-e vs Pedido de Compra</li>
              <li>Quantidades recebidas vs Pedido</li>
              <li>Dados do fornecedor</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Divergências serão identificadas automaticamente.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConferir} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conferindo...
              </>
            ) : (
              'Iniciar Conferência'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
