'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
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

interface EnviarEmailButtonProps {
  cotacaoId: string
  emailFornecedor?: string
  status?: string
}

export function EnviarEmailButton({
  cotacaoId,
  emailFornecedor,
  status,
}: EnviarEmailButtonProps) {
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(status === 'ENVIADA')

  const handleEnviar = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/cotacoes/${cotacaoId}/enviar-email`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar e-mail')
      }

      toast.success('E-mail enviado com sucesso!', {
        description: `Cotação enviada para ${emailFornecedor}`,
      })

      setEnviado(true)
      window.location.reload()
    } catch (error: any) {
      console.error('Erro ao enviar e-mail:', error)
      toast.error('Erro ao enviar e-mail', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!emailFornecedor) {
    return (
      <Button variant="outline" disabled>
        <Mail className="mr-2 h-4 w-4" />
        Sem e-mail cadastrado
      </Button>
    )
  }

  if (enviado) {
    return (
      <Button variant="outline" disabled>
        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
        E-mail Enviado
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Enviar por E-mail
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enviar cotação por e-mail?</AlertDialogTitle>
          <AlertDialogDescription>
            A cotação será enviada para:
            <br />
            <strong>{emailFornecedor}</strong>
            <br />
            <br />
            O fornecedor receberá um e-mail com todos os detalhes da cotação e
            um link para responder.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleEnviar} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Confirmar Envio'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
