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
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Props {
  plano: string
  nomePlano: string
  valor: number
  planoAtual: string
}

export function SelecionarPlanoButton({
  plano,
  nomePlano,
  valor,
  planoAtual,
}: Props) {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const isUpgrade = getPlanoNivel(plano) > getPlanoNivel(planoAtual)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/mudar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano, valor }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar plano')
      }

      toast.success(
        isUpgrade
          ? `Plano atualizado para ${nomePlano}!`
          : `Plano alterado para ${nomePlano}`
      )
      router.refresh()
      setShowDialog(false)
    } catch (error) {
      console.error('Erro ao mudar plano:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao alterar plano'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={isUpgrade ? 'default' : 'outline'}
        className="w-full"
        onClick={() => setShowDialog(true)}
      >
        {isUpgrade ? (
          <>
            <TrendingUp className="mr-2 h-4 w-4" />
            Fazer Upgrade
          </>
        ) : (
          <>
            <TrendingDown className="mr-2 h-4 w-4" />
            Mudar Plano
          </>
        )}
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isUpgrade ? 'Fazer Upgrade' : 'Alterar Plano'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a{' '}
                {isUpgrade ? 'fazer upgrade' : 'alterar seu plano'} para{' '}
                <strong>{nomePlano}</strong> por{' '}
                <strong>{formatCurrency(valor)}/mês</strong>.
              </p>

              {isUpgrade && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    ✓ Acesso imediato aos novos recursos
                    <br />✓ Cobrança proporcional no próximo vencimento
                  </p>
                </div>
              )}

              {!isUpgrade && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-900">
                    ⚠️ Alguns recursos serão removidos
                    <br />⚠️ Crédito proporcional aplicado na próxima fatura
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function getPlanoNivel(plano: string): number {
  const niveis: Record<string, number> = {
    BASICO: 1,
    PROFISSIONAL: 2,
    ENTERPRISE: 3,
  }
  return niveis[plano] || 0
}
