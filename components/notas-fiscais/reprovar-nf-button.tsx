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
import { Textarea } from '@/components/ui/textarea'
import { XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ReprovarNFButtonProps {
  nfId: string
}

export function ReprovarNFButton({ nfId }: ReprovarNFButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [motivo, setMotivo] = useState('')

  const handleReprovar = async () => {
    if (!motivo.trim()) {
      toast.error('Informe o motivo da reprovação')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Atualizar status e adicionar motivo nas divergências
      const { error } = await supabase
        .from('notas_fiscais')
        .update({
          status: 'DIVERGENTE',
          divergencias: [
            {
              tipo: 'REPROVACAO',
              motivo,
              data: new Date().toISOString(),
            },
          ],
        })
        .eq('id', nfId)

      if (error) throw error

      toast.success('Nota fiscal reprovada')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao reprovar NF:', error)
      toast.error(error.message || 'Erro ao reprovar nota fiscal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <XCircle className="mr-2 h-4 w-4" />
          Reprovar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reprovar Nota Fiscal</DialogTitle>
          <DialogDescription>
            Informe o motivo da reprovação desta NF-e
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo da Reprovação <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Divergência de valores, produtos errados, etc."
              rows={4}
              required
            />
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
            variant="destructive"
            onClick={handleReprovar}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reprovando...
              </>
            ) : (
              'Confirmar Reprovação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
