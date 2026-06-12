'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RefreshCw, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface RenovarContratoButtonProps {
  contratoId: string
}

export function RenovarContratoButton({
  contratoId,
}: RenovarContratoButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [novaDataFim, setNovaDataFim] = useState('')

  const handleRenovar = async () => {
    if (!novaDataFim) {
      toast.error('Informe a nova data de término')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Buscar contrato atual para validar
      const { data: contratoAtual } = await supabase
        .from('contratos')
        .select('fim')
        .eq('id', contratoId)
        .single()

      if (contratoAtual) {
        const dataAtual = new Date(contratoAtual.fim)
        const novaData = new Date(novaDataFim)

        if (novaData <= dataAtual) {
          toast.error('A nova data deve ser posterior à data atual de término')
          setLoading(false)
          return
        }
      }

      // Atualizar contrato
      const { error } = await supabase
        .from('contratos')
        .update({
          fim: novaDataFim,
          status: 'ATIVO',
        })
        .eq('id', contratoId)

      if (error) throw error

      toast.success('Contrato renovado com sucesso!')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao renovar contrato:', error)
      toast.error(error.message || 'Erro ao renovar contrato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Renovar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renovar Contrato</DialogTitle>
          <DialogDescription>
            Estenda a vigência deste contrato informando uma nova data de término
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nova_data_fim">
              Nova Data de Término <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nova_data_fim"
              type="date"
              value={novaDataFim}
              onChange={(e) => setNovaDataFim(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Informe a nova data de término da vigência do contrato
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleRenovar}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Renovando...
              </>
            ) : (
              'Confirmar Renovação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
