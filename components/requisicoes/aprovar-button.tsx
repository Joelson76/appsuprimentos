'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface AprovarRequisicaoButtonProps {
  requisicaoId: string
  aprovar: boolean
}

export function AprovarRequisicaoButton({
  requisicaoId,
  aprovar,
}: AprovarRequisicaoButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Buscar usuário logado
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não autenticado')
        return
      }

      // Atualizar requisição
      const { error: updateError } = await supabase
        .from('requisicoes')
        .update({
          status: aprovar ? 'APROVADA' : 'REPROVADA',
          aprovado_por: user.id,
          aprovado_em: new Date().toISOString(),
          observacoes_aprovacao: observacoes.trim() || null,
        })
        .eq('id', requisicaoId)

      if (updateError) {
        throw updateError
      }

      // Fechar dialog e recarregar
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao processar aprovação:', err)
      setError(err.message || 'Erro ao processar aprovação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={aprovar ? 'default' : 'destructive'}
        className={aprovar ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        {aprovar ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Aprovar
          </>
        ) : (
          <>
            <XCircle className="mr-2 h-4 w-4" />
            Reprovar
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {aprovar ? 'Aprovar' : 'Reprovar'} Requisição
            </DialogTitle>
            <DialogDescription>
              {aprovar
                ? 'Confirme a aprovação desta requisição de compra.'
                : 'Informe o motivo da reprovação desta requisição.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="observacoes">
                Observações {aprovar ? '(opcional)' : '*'}
              </Label>
              <Input
                id="observacoes"
                placeholder={
                  aprovar
                    ? 'Adicione observações (opcional)'
                    : 'Informe o motivo da reprovação'
                }
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                required={!aprovar}
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
              onClick={handleSubmit}
              disabled={loading || (!aprovar && !observacoes.trim())}
              variant={aprovar ? 'default' : 'destructive'}
              className={aprovar ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {loading
                ? 'Processando...'
                : aprovar
                  ? 'Confirmar Aprovação'
                  : 'Confirmar Reprovação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
